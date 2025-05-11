CREATE TABLE IF NOT EXISTS public.call_logs (
    id SERIAL PRIMARY KEY,
    call_uuid TEXT UNIQUE NOT NULL, -- This would be callIdRef.current
    initiator_user_id UUID REFERENCES public.profiles(id),
    receiver_user_id UUID REFERENCES public.profiles(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status TEXT -- e.g., 'completed', 'failed_connection', 'abandoned'
);
-- RLS: Users can see their own call logs.
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can see their own call logs"
ON public.call_logs
FOR SELECT
USING (auth.uid() = initiator_user_id OR auth.uid() = receiver_user_id);
-- INSERT policy would likely be SECURITY DEFINER function or handled by backend logic.