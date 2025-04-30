-- Create table for polls
CREATE TABLE IF NOT EXISTS polls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  allow_multiple_choices BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false
);

-- Create table for poll options
CREATE TABLE IF NOT EXISTS poll_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for poll responses
CREATE TABLE IF NOT EXISTS poll_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_response UNIQUE(poll_id, user_id, option_id)
);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

-- Policies for polls
CREATE POLICY "Anyone can view polls" ON polls
  FOR SELECT USING (true);

CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can manage their polls" ON polls
  FOR ALL USING (auth.uid() = created_by);

-- Policies for poll options
CREATE POLICY "Anyone can view poll options" ON poll_options
  FOR SELECT USING (true);

CREATE POLICY "Poll creators can manage options" ON poll_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_options.poll_id
      AND polls.created_by = auth.uid()
    )
  );

-- Policies for poll responses
CREATE POLICY "Users can view poll responses" ON poll_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls
      WHERE polls.id = poll_responses.poll_id
      AND (NOT polls.is_anonymous OR polls.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can vote on polls" ON poll_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to get poll results
CREATE OR REPLACE FUNCTION get_poll_results(poll_id_param UUID)
RETURNS TABLE (
  option_id UUID,
  option_text TEXT,
  response_count BIGINT,
  percentage NUMERIC,
  voters JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_responses BIGINT;
  is_anonymous BOOLEAN;
BEGIN
  -- Get poll anonymity setting
  SELECT polls.is_anonymous INTO is_anonymous
  FROM polls
  WHERE polls.id = poll_id_param;
  
  -- Get total responses for percentage calculation
  SELECT COUNT(DISTINCT user_id) INTO total_responses
  FROM poll_responses
  WHERE poll_id = poll_id_param;

  RETURN QUERY
  SELECT
    po.id as option_id,
    po.option_text,
    COUNT(pr.id) as response_count,
    CASE
      WHEN total_responses > 0 THEN
        ROUND((COUNT(pr.id)::NUMERIC / total_responses) * 100, 2)
      ELSE 0
    END as percentage,
    CASE
      WHEN is_anonymous AND auth.uid() != (SELECT created_by FROM polls WHERE id = poll_id_param) THEN
        NULL::JSON
      ELSE
        COALESCE(
          json_agg(
            json_build_object(
              'user_id', p.id,
              'username', p.username,
              'avatar_url', p.avatar_url
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'::JSON
        )
    END as voters
  FROM poll_options po
  LEFT JOIN poll_responses pr ON pr.option_id = po.id
  LEFT JOIN profiles p ON p.id = pr.user_id
  WHERE po.poll_id = poll_id_param
  GROUP BY po.id, po.option_text;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_poll_responses_poll_id ON poll_responses(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_responses_user_id ON poll_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_poll_options_poll_id ON poll_options(poll_id);