import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afwdtqsmozowdezknarg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmd2R0cXNtb3pvd2RlemtuYXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDgyMzEsImV4cCI6MjA5NTk4NDIzMX0.P622eCA-2neJbrqYhhs0lLU6vO-sWM9SF_roJfgkpkA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function sendReset() {
  console.log("Sending password reset email...");
  const { data, error } = await supabase.auth.resetPasswordForEmail('oksos2005@gmail.com', {
      redirectTo: 'http://localhost:5173/reset-password',
  });
  console.log("Result:", JSON.stringify({ data, error }));
}
sendReset();
