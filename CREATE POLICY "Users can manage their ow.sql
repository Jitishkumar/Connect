CREATE POLICY "Users can manage their own waiting status"
ON public.users_waiting
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);