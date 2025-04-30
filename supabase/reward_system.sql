-- Create table for user achievements and rewards
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_posts INTEGER DEFAULT 0,
  total_stories INTEGER DEFAULT 0,
  total_comments INTEGER DEFAULT 0,
  total_likes_received INTEGER DEFAULT 0,
  total_followers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for badges
CREATE TABLE IF NOT EXISTS badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT NOT NULL,
  required_points INTEGER DEFAULT 0,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for user badges
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_user_badge UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view badges" ON badges
  FOR SELECT USING (true);

CREATE POLICY "Users can view earned badges" ON user_badges
  FOR SELECT USING (auth.uid() = user_id);

-- Function to update user points and level
CREATE OR REPLACE FUNCTION update_user_achievements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create achievement record if it doesn't exist
  INSERT INTO user_achievements (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (id) DO NOTHING;

  -- Update achievement metrics based on action type
  CASE TG_TABLE_NAME
    WHEN 'posts' THEN
      UPDATE user_achievements
      SET 
        total_posts = total_posts + 1,
        points = points + 10,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    
    WHEN 'stories' THEN
      UPDATE user_achievements
      SET 
        total_stories = total_stories + 1,
        points = points + 5,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    
    WHEN 'comments' THEN
      UPDATE user_achievements
      SET 
        total_comments = total_comments + 1,
        points = points + 2,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    
    WHEN 'likes' THEN
      UPDATE user_achievements
      SET 
        total_likes_received = total_likes_received + 1,
        points = points + 1,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
  END CASE;

  -- Update user level based on points
  UPDATE user_achievements
  SET level = GREATEST(1, FLOOR(SQRT(points / 100))::INTEGER)
  WHERE user_id = NEW.user_id;

  -- Check and award new badges
  INSERT INTO user_badges (user_id, badge_id)
  SELECT 
    NEW.user_id,
    b.id
  FROM badges b
  JOIN user_achievements ua ON ua.user_id = NEW.user_id
  WHERE ua.points >= b.required_points
  AND NOT EXISTS (
    SELECT 1 FROM user_badges ub
    WHERE ub.user_id = NEW.user_id
    AND ub.badge_id = b.id
  );

  RETURN NEW;
END;
$$;

-- Create triggers for point updates
CREATE TRIGGER update_achievements_on_post
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_user_achievements();

CREATE TRIGGER update_achievements_on_story
  AFTER INSERT ON stories
  FOR EACH ROW
  EXECUTE FUNCTION update_user_achievements();

CREATE TRIGGER update_achievements_on_comment
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_user_achievements();

CREATE TRIGGER update_achievements_on_like
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_achievements();

-- Function to get user rewards summary
CREATE OR REPLACE FUNCTION get_user_rewards_summary(user_id_param UUID)
RETURNS TABLE (
  points INTEGER,
  level INTEGER,
  next_level_points INTEGER,
  total_badges INTEGER,
  recent_badges JSON,
  achievements JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.points,
    ua.level,
    (ua.level + 1)^2 * 100 as next_level_points,
    COUNT(DISTINCT ub.id)::INTEGER as total_badges,
    COALESCE(
      json_agg(
        json_build_object(
          'name', b.name,
          'description', b.description,
          'icon_url', b.icon_url,
          'earned_at', ub.earned_at
        )
        ORDER BY ub.earned_at DESC
        LIMIT 5
      ) FILTER (WHERE b.id IS NOT NULL),
      '[]'::JSON
    ) as recent_badges,
    json_build_object(
      'posts', ua.total_posts,
      'stories', ua.total_stories,
      'comments', ua.total_comments,
      'likes_received', ua.total_likes_received,
      'followers', ua.total_followers
    ) as achievements
  FROM user_achievements ua
  LEFT JOIN user_badges ub ON ub.user_id = ua.user_id
  LEFT JOIN badges b ON b.id = ub.badge_id
  WHERE ua.user_id = user_id_param
  GROUP BY 
    ua.points,
    ua.level,
    ua.total_posts,
    ua.total_stories,
    ua.total_comments,
    ua.total_likes_received,
    ua.total_followers;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_badges_required_points ON badges(required_points);