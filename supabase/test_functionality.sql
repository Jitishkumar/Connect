-- Test Reward System Functionality

-- 1. Create test user
INSERT INTO profiles (id, username, full_name, avatar_url)
VALUES 
  ('test-user-id', 'testuser', 'Test User', 'default-avatar.png')
ON CONFLICT (id) DO NOTHING;

-- 2. Test post creation and points
INSERT INTO posts (id, user_id, content)
VALUES 
  ('test-post-id', 'test-user-id', 'Test post content');

-- Verify points (should have +10 points)
SELECT points, total_posts FROM user_achievements WHERE user_id = 'test-user-id';

-- 3. Test story creation and points
INSERT INTO stories (id, user_id, media_url)
VALUES 
  ('test-story-id', 'test-user-id', 'test-media-url');

-- Verify points (should have +5 points)
SELECT points, total_stories FROM user_achievements WHERE user_id = 'test-user-id';

-- 4. Test comment and points
INSERT INTO post_comments (id, post_id, user_id, content)
VALUES 
  ('test-comment-id', 'test-post-id', 'test-user-id', 'Test comment');

-- Verify points (should have +2 points)
SELECT points, total_comments FROM user_achievements WHERE user_id = 'test-user-id';

-- 5. Test like and points
INSERT INTO post_likes (post_id, user_id)
VALUES 
  ('test-post-id', 'test-user-id');

-- Verify points (should have +1 point)
SELECT points, total_likes_received FROM user_achievements WHERE user_id = 'test-user-id';

-- Test Interactive Polls Functionality

-- 1. Create test poll
INSERT INTO polls (id, post_id, question, created_by)
VALUES 
  ('test-poll-id', 'test-post-id', 'Test poll question?', 'test-user-id');

-- 2. Add poll options
INSERT INTO poll_options (id, poll_id, option_text)
VALUES 
  ('option-1-id', 'test-poll-id', 'Option 1'),
  ('option-2-id', 'test-poll-id', 'Option 2');

-- 3. Test poll response
INSERT INTO poll_responses (poll_id, option_id, user_id)
VALUES 
  ('test-poll-id', 'option-1-id', 'test-user-id');

-- 4. Verify poll results
SELECT 
  p.question,
  po.option_text,
  COUNT(pr.id) as votes
FROM polls p
JOIN poll_options po ON po.poll_id = p.id
LEFT JOIN poll_responses pr ON pr.option_id = po.id
WHERE p.id = 'test-poll-id'
GROUP BY p.question, po.option_text;

-- Test Profile Visits Functionality

-- 1. Record profile visit
SELECT * FROM record_profile_visit('test-user-id', 'visitor-id');

-- 2. Get profile visits count
SELECT COUNT(*) as visit_count
FROM profile_visits
WHERE profile_id = 'test-user-id'
AND visited_at > NOW() - INTERVAL '30 days';

-- Cleanup test data
DELETE FROM poll_responses WHERE poll_id = 'test-poll-id';
DELETE FROM poll_options WHERE poll_id = 'test-poll-id';
DELETE FROM polls WHERE id = 'test-poll-id';
DELETE FROM post_likes WHERE post_id = 'test-post-id';
DELETE FROM post_comments WHERE post_id = 'test-post-id';
DELETE FROM posts WHERE id = 'test-post-id';
DELETE FROM stories WHERE id = 'test-story-id';
DELETE FROM profile_visits WHERE profile_id = 'test-user-id';
DELETE FROM user_achievements WHERE user_id = 'test-user-id';
DELETE FROM profiles WHERE id = 'test-user-id';