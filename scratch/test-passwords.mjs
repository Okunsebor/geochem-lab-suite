import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://afwdtqsmozowdezknarg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmd2R0cXNtb3pvd2RlemtuYXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDgyMzEsImV4cCI6MjA5NTk4NDIzMX0.P622eCA-2neJbrqYhhs0lLU6vO-sWM9SF_roJfgkpkA';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPasswords() {
  const passwords = [
    '12345678',
    'oksos@unipod',
    'okunsebor@unipod',
    'prof@unipod',
    'admin@unipod',
    'system@unipod',
    'joel@unipod',
    'oksos2005@unipod',
  ];

  for (const p of passwords) {
      console.log("Trying password:", p);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'oksos2005@gmail.com',
        password: p,
      });
      if (!error) {
          console.log("SUCCESS with password:", p);
          return;
      }
  }
  console.log("All failed.");
}

testPasswords();
