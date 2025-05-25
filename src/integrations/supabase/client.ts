
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iejbifkpqayzqennpwuf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllamJpZmtwcWF5enFlbm5wd3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MDgyODAsImV4cCI6MjA2Mjk4NDI4MH0.gnyWn8gxGvDaS4cY9ort1bBhPwEWD3lU9Eu6dt60IUs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
