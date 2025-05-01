-- Function to maintain a rolling 30-day window of profile visits
-- This function removes individual visit records that are older than 30 days
-- For example: If a user visited a profile every day for 32 days,
-- on day 32, visits from days 1 and 2 will be removed as they are older than 30 days,
-- resulting in exactly 30 visits being shown (from day 3 to day 32)
CREATE OR REPLACE FUNCTION cleanup_old_profile_visits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete individual visits that are older than 30 days
  -- This maintains a rolling window of the most recent 30 days of visits
  DELETE FROM profile_visits
  WHERE visited_at < (CURRENT_TIMESTAMP - INTERVAL '30 days');
END;
$$;


-- Create a trigger to automatically run cleanup daily
CREATE OR REPLACE FUNCTION trigger_cleanup_profile_visits()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Run cleanup function
  PERFORM cleanup_old_profile_visits();
  RETURN NEW;
END;
$$;


-- Create a trigger that runs daily at midnight
CREATE OR REPLACE TRIGGER daily_profile_visits_cleanup
  AFTER INSERT ON profile_visits
  FOR EACH STATEMENT
  WHEN (EXTRACT(HOUR FROM CURRENT_TIMESTAMP) = 0)
  EXECUTE FUNCTION trigger_cleanup_profile_visits();


-- Create an index to improve cleanup performance
CREATE INDEX IF NOT EXISTS idx_profile_visits_cleanup
ON profile_visits (visited_at);