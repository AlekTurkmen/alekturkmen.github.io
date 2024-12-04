// Create new file: supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bphgxbdtofjpxiumasyc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwaGd4YmR0b2ZqcHhpdW1hc3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI3Mzc1MTYsImV4cCI6MjA0ODMxMzUxNn0.pMZpbKbJ-fS9XpmwXCMbvjTOfAW7OfvlVD_IQJ6U7Rc'
);

export default supabase;