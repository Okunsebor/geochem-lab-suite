import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afwdtqsmozowdezknarg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmd2R0cXNtb3pvd2RlemtuYXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDgyMzEsImV4cCI6MjA5NTk4NDIzMX0.P622eCA-2neJbrqYhhs0lLU6vO-sWM9SF_roJfgkpkA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignup() {
  console.log("Signing up dummy user...");
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: 'dummy' + Date.now() + '@example.com',
    password: 'password123',
  });
  console.log("Signup returned:", JSON.stringify({ data: signupData, error: signupError }));
  
  if (signupData.user) {
    console.log("Trying to login dummy user immediately...");
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: signupData.user.email,
      password: 'password123',
    });
    console.log("Login returned:", JSON.stringify({ data: loginData, error: loginError }));
  }
}
testSignup();
