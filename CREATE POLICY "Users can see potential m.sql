CREATE POLICY "Users can see potential matches"
ON public.users_waiting
FOR SELECT
USING (status = 'waiting');