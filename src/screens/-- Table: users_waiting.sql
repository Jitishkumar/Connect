-- Table: users_waiting
-- Stores users actively waiting for a match or currently in a call initiated via this system.
CREATE TABLE IF NOT EXISTS public.users_waiting (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    gender TEXT NOT NULL,
    preferred_gender TEXT NOT NULL, -- The gender this user wants to be matched with
    status TEXT NOT NULL DEFAULT 'waiting', -- 'waiting', 'in-call'
    current_call_id TEXT, -- Unique ID for the call they are in or initiating
    matched_with_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Realtime for users_waiting table
ALTER TABLE public.users_waiting REPLICA IDENTITY FULL;
-- For Supabase Realtime to pick up changes, ensure the table is published.
-- In Supabase Dashboard: Database -> Replication -> Source (e.g., supabase_realtime) -> Add table "users_waiting" to publication.
-- Or run:
-- alter publication supabase_realtime add table public.users_waiting; (If not already done by default)


-- RLS Policies for users_waiting
ALTER TABLE public.users_waiting ENABLE ROW LEVEL SECURITY;

-- Users can see all 'waiting' users (for matching purposes)
CREATE POLICY "Allow read access to waiting users"
ON public.users_waiting
FOR SELECT
USING (status = 'waiting');

-- Authenticated users can insert their own waiting record
CREATE POLICY "Allow authenticated users to insert their own waiting record"
ON public.users_waiting
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own record (e.g., to 'in-call' or update timestamp)
-- Or if they are being matched by another user (system/function might do this)
CREATE POLICY "Allow users to update their own status or be updated if matched"
ON public.users_waiting
FOR UPDATE
USING (
    auth.uid() = user_id OR
    -- This part is tricky for direct client updates by the matcher.
    -- Ideally, a Supabase function handles the atomic match and update.
    -- For client-side, the matcher updates the other user's record.
    -- This policy needs to be carefully considered.
    -- A simpler approach for client-side updates:
    (status = 'waiting' AND auth.uid() != user_id) -- Allows a matcher to update a 'waiting' user
)
WITH CHECK (auth.uid() = user_id);


-- Users can delete their own waiting record
CREATE POLICY "Allow users to delete their own waiting record"
ON public.users_waiting
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_users_waiting_updated
BEFORE UPDATE ON public.users_waiting
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Cleanup function for stale users_waiting records (you mentioned you have this)
-- This is a safety net. The app tries to delete records on call end/unmount.
CREATE OR REPLACE FUNCTION public.cleanup_stale_waiting_users()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.users_waiting
    WHERE status = 'waiting' AND created_at < NOW() - INTERVAL '10 minutes';

    -- Consider also cleaning 'in-call' records if they seem stuck for too long,
    -- though this is riskier as a call might legitimately be long.
    -- DELETE FROM public.users_waiting
    -- WHERE status = 'in-call' AND updated_at < NOW() - INTERVAL '60 minutes';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the cleanup (e.g., using pg_cron if available on your Supabase instance, or call manually/via other means)
-- Example for pg_cron (check Supabase docs for enabling/using cron)
-- SELECT cron.schedule('cleanup-waiting-users', '*/5 * * * *', 'SELECT public.cleanup_stale_waiting_users()');
