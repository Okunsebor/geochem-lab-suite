import re
import os

affected_tables = [
    'samples',
    'sample_notes',
    'custody_logs',
    'analytical_results',
    'sample_attachments',
    'preparation_jobs',
    'preparation_steps',
    'analytical_runs',
    'qa_flags',
    'reports',
    'report_logs',
    'sample_logs',
    'tracking_updates'
]

with open('consolidated_schema.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

policy_names = {}
for table in affected_tables:
    policy_names[table] = []

matches = re.finditer(r'CREATE POLICY\s+\"([^\"]+)\"\s+ON\s+(?:public\.)?(\w+)', sql, re.IGNORECASE)
for m in matches:
    name = m.group(1)
    table = m.group(2)
    if table in affected_tables:
        policy_names[table].append(name)

with open('scratch/policies.txt', 'w', encoding='utf-8') as f:
    for table, names in policy_names.items():
        for name in names:
            f.write(f'DROP POLICY IF EXISTS "{name}" ON public.{table};\n')
    
    f.write('\n-- RECREATE POLICIES --\n')
    
    for table, names in policy_names.items():
        for name in names:
            # Match the policy definition until the next semicolon
            pattern = r'(CREATE POLICY\s+\"' + re.escape(name) + r'\"\s+ON\s+(?:public\.)?' + re.escape(table) + r'[\s\S]*?;)'
            m = re.search(pattern, sql, re.IGNORECASE)
            if m:
                f.write(m.group(1) + '\n\n')
