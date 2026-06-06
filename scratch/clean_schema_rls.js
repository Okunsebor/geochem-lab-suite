import fs from 'fs';
import path from 'path';

const migrationsDir = 'c:/Users/PROF. OKUNSEBOR/geochem-lab-suite/supabase/migrations';

function processFile(filename, replacer) {
  const p = path.join(migrationsDir, filename);
  let content = fs.readFileSync(p, 'utf8');
  const newContent = replacer(content);
  if (content !== newContent) {
    fs.writeFileSync(p, newContent, 'utf8');
    console.log(`Updated ${filename}`);
  }
}

// 0001: Remove ALL CREATE POLICY
processFile('0001_initial_schema.sql', (c) => {
  return c.replace(/-- Organizations:[\s\S]*?(?=$)/, '');
});

// 0004: Remove explicit lab staff policies (lines 96-105)
processFile('0004_preparation_workflow.sql', (c) => {
  return c.replace(/-- Explicit lab staff policies for prep records[\s\S]*?(?=$)/, '');
});

// 0005: Remove explicit lab staff policies
processFile('0005_analysis_qaqc.sql', (c) => {
  return c.replace(/-- Explicit lab staff policies for analysis, QA\/QC and methods[\s\S]*?(?=$)/, '');
});

// 0006: Remove explicit policies
processFile('0006_reporting_module.sql', (c) => {
  return c.replace(/-- Explicit policies for reports with organization-level scoping for customers[\s\S]*?(?=-- ─────────────────────────────────────────────\n-- AUDIT TRIGGER LINKAGE)/, '');
});

// 0008: Remove DROP POLICY lines and clean up reports/prep
processFile('0008_rbac_overhaul.sql', (c) => {
  let content = c.replace(/DROP POLICY IF EXISTS ".*?" ON public\..*?;\n/g, '');
  content = content.replace(/-- Reports \/ Report logs[\s\S]*?(?=-- Preparation workflow \(lab only\))/g, '');
  return content;
});

// 0011: Remove DROP POLICY lines
processFile('0011_fix_rbac_recursion.sql', (c) => {
  return c.replace(/DROP POLICY IF EXISTS ".*?" ON public\..*?;\n/g, '');
});

// 0002: Rewrite policies to use helper functions
processFile('0002_sample_enhancements.sql', (c) => {
  return c.replace(/CREATE POLICY "Customers view org sample attachments"[\s\S]*?(?=$)/, `CREATE POLICY "Customers view org sample attachments"
ON public.sample_attachments FOR SELECT
USING (sample_id IN (
    SELECT id FROM public.samples 
    WHERE project_id IN (
        SELECT id FROM public.projects 
        WHERE organization_id = public.current_user_org_id()
    )
));

CREATE POLICY "Lab staff view all attachments"
ON public.sample_attachments FOR SELECT
USING (public.is_lab_coordinator());

CREATE POLICY "Lab staff manage sample attachments"
ON public.sample_attachments FOR ALL
USING (public.is_lab_coordinator());
`);
});

console.log("RLS deduplication complete.");
