import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afwdtqsmozowdezknarg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmd2R0cXNtb3pvd2RlemtuYXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDgyMzEsImV4cCI6MjA5NTk4NDIzMX0.P622eCA-2neJbrqYhhs0lLU6vO-sWM9SF_roJfgkpkA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log("Attempting login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'oksos2005@gmail.com',
    password: '12345678',
  });

  if (error) {
    console.error("Login failed:", error.message);
  } else {
    console.log("Login successful! User ID:", data.user?.id);
  }
}

testLogin();
