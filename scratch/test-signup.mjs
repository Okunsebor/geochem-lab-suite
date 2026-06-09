import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afwdtqsmozowdezknarg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmd2R0cXNtb3pvd2RlemtuYXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDgyMzEsImV4cCI6MjA5NTk4NDIzMX0.P622eCA-2neJbrqYhhs0lLU6vO-sWM9SF_roJfgkpkA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignUp() {
  console.log("Attempting sign up...");
  const { data, error } = await supabase.auth.signUp({
    email: 'oksos2005@gmail.com',
    password: '12345678',
    options: {
      data: {
        first_name: 'System',
        last_name: 'Admin',
        full_name: 'System Admin',
        phone: '1234567890',
        organization_name: 'GeoChem',
        role: 'admin',
      }
    }
  });

  if (error) {
    console.error("Sign up failed:", error.message);
  } else {
    console.log("Sign up successful! User ID:", data.user?.id);
    
    // Now try to log in
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'oksos2005@gmail.com',
        password: '12345678',
    });
    if (loginError) {
        console.error("Subsequent login failed:", loginError.message);
    } else {
        console.log("Subsequent login successful! Session:", !!loginData.session);
    }
  }
}

testSignUp();
