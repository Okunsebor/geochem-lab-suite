import fs from 'fs';
import path from 'path';

const migrationsDir = 'c:/Users/PROF. OKUNSEBOR/geochem-lab-suite/supabase/migrations';
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

let count = 0;
for (const file of files) {
  const p = path.join(migrationsDir, file);
  let content = fs.readFileSync(p, 'utf8');
  const original = content;
  
  // Replace CREATE TRIGGER to add DROP TRIGGER IF EXISTS before it
  // Example: CREATE TRIGGER audit_samples_changes ... ON public.samples
  content = content.replace(/CREATE TRIGGER\s+([a-zA-Z0-9_]+)[\s\S]*?ON\s+([a-zA-Z0-9_\.]+)/gi, (match, triggerName, tableName) => {
    // If it already has DROP TRIGGER IF EXISTS right before, don't duplicate
    return `DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName};\n${match}`;
  });

  // Clean up any double drops just in case
  content = content.replace(new RegExp(`DROP TRIGGER IF EXISTS ([a-zA-Z0-9_]+) ON ([a-zA-Z0-9_\\.]+);\\s*DROP TRIGGER IF EXISTS \\1 ON \\2;`, 'gi'), (match, t, tb) => {
    return `DROP TRIGGER IF EXISTS ${t} ON ${tb};`;
  });

  if (content !== original) {
    fs.writeFileSync(p, content, 'utf8');
    count++;
  }
}
console.log('Fixed triggers in ' + count + ' files');
