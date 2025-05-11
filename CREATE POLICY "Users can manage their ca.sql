CREATE POLICY "Users can manage their call signals"
ON public.calls
FOR ALL
USING (auth.uid() = from_user OR auth.uid() = to_user)
WITH CHECK (auth.uid() = from_user); -- Only the sender can insert initial records