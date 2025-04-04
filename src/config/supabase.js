import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ytvtscdjzbiqvvfbrrtt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0dnRzY2RqemJpcXZ2ZmJycnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM1ODc1NDQsImV4cCI6MjA1OTE2MzU0NH0.J_Iu9ZvesF7ksPMID_-lVmmVLR22ZL8PjYqUl5NQvrc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);