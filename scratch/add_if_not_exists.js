import fs from 'fs';
import path from 'path';

const migrationsDir = 'c:/Users/PROF. OKUNSEBOR/geochem-lab-suite/supabase/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

let count = 0;
for (const file of files) {
  const p = path.join(migrationsDir, file);
  let content = fs.readFileSync(p, 'utf8');
  const original = content;
  
  content = content.replace(/CREATE TABLE public\.([a-zA-Z0-9_]+)/g, (match, p1) => {
    return 'CREATE TABLE IF NOT EXISTS public.' + p1;
  });
  content = content.replace(/CREATE TABLE ([a-zA-Z0-9_]+)/g, (match, p1) => {
     if (p1.toUpperCase() === 'IF') return match;
     return 'CREATE TABLE IF NOT EXISTS ' + p1;
  });
  content = content.replace(/CREATE INDEX ([a-zA-Z0-9_]+)/g, (match, p1) => {
     if (p1.toUpperCase() === 'IF') return match;
     return 'CREATE INDEX IF NOT EXISTS ' + p1;
  });

  content = content.replace(/IF NOT EXISTS IF NOT EXISTS/g, 'IF NOT EXISTS');

  if (content !== original) {
    fs.writeFileSync(p, content, 'utf8');
    count++;
  }
}
console.log('Fixed ' + count + ' files with IF NOT EXISTS');
