-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_similarity;
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table to store content embeddings
CREATE TABLE IF NOT EXISTS content_embeddings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'story', 'confession')),
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_content
    FOREIGN KEY (content_id)
    REFERENCES CASE
      WHEN content_type = 'post' THEN posts(id)
      WHEN content_type = 'story' THEN stories(id)
      WHEN content_type = 'confession' THEN confessions(id)
    END
    ON DELETE CASCADE
);

-- Create a function to get personalized recommendations
CREATE OR REPLACE FUNCTION get_personalized_recommendations(
  user_id_param UUID,
  limit_param INTEGER DEFAULT 20
)
RETURNS TABLE (
  content_id UUID,
  content_type TEXT,
  similarity_score FLOAT,
  engagement_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_interests AS (
    -- Get user's recent interactions
    SELECT 
      COALESCE(p.id, s.id, c.id) as interacted_content_id,
      CASE
        WHEN p.id IS NOT NULL THEN 'post'
        WHEN s.id IS NOT NULL THEN 'story'
        WHEN c.id IS NOT NULL THEN 'confession'
      END as content_type,
      ce.embedding as content_embedding
    FROM (
      -- Combine likes, comments, and views
      SELECT content_id, created_at
      FROM likes
      WHERE user_id = user_id_param
      UNION ALL
      SELECT post_id, created_at
      FROM comments
      WHERE user_id = user_id_param
      UNION ALL
      SELECT story_id, viewed_at
      FROM story_views
      WHERE viewer_id = user_id_param
    ) interactions
    LEFT JOIN posts p ON p.id = interactions.content_id
    LEFT JOIN stories s ON s.id = interactions.content_id
    LEFT JOIN confessions c ON c.id = interactions.content_id
    LEFT JOIN content_embeddings ce ON ce.content_id = COALESCE(p.id, s.id, c.id)
    WHERE created_at > NOW() - INTERVAL '7 days'
  ),
  content_scores AS (
    -- Calculate content similarity and engagement scores
    SELECT
      ce.content_id,
      ce.content_type,
      AVG(1 - (ce.embedding <-> ui.content_embedding)) as similarity_score,
      (
        SELECT COUNT(*)
        FROM likes l
        WHERE l.content_id = ce.content_id
      ) + (
        SELECT COUNT(*)
        FROM comments c
        WHERE c.post_id = ce.content_id
      ) as engagement_count
    FROM content_embeddings ce
    CROSS JOIN user_interests ui
    WHERE ce.content_id NOT IN (SELECT interacted_content_id FROM user_interests)
    GROUP BY ce.content_id, ce.content_type, engagement_count
  )
  SELECT
    cs.content_id,
    cs.content_type,
    cs.similarity_score,
    GREATEST(LOG(cs.engagement_count + 1), 0) as engagement_score
  FROM content_scores cs
  ORDER BY (cs.similarity_score * 0.7 + GREATEST(LOG(cs.engagement_count + 1), 0) * 0.3) DESC
  LIMIT limit_param;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_embeddings_content_id
ON content_embeddings (content_id);

CREATE INDEX IF NOT EXISTS idx_content_embeddings_type
ON content_embeddings (content_type);

-- Create a function to update content embeddings
CREATE OR REPLACE FUNCTION update_content_embedding()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Note: In a real implementation, you would call your AI service here
  -- to generate the embedding vector for the content
  INSERT INTO content_embeddings (content_id, content_type)
  VALUES (NEW.id, TG_TABLE_NAME::text);
  
  RETURN NEW;
END;
$$;

-- Create triggers for automatic embedding updates
CREATE TRIGGER update_post_embedding
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_content_embedding();

CREATE TRIGGER update_story_embedding
  AFTER INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_content_embedding();

CREATE TRIGGER update_confession_embedding
  AFTER INSERT ON confessions
  FOR EACH ROW
  EXECUTE FUNCTION update_content_embedding();