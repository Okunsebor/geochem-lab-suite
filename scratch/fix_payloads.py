import re

with open('src/hooks/use-samples-core.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove performed_by_user_id lines completely
content = re.sub(r'\s*performed_by_user_id:\s*[^,]+,', '', content)

# Replace 'comments:' with 'notes:'
content = re.sub(r'comments:\s*\"(.*?)\"', r'notes: "\1"', content)
content = re.sub(r'comments:\s*`([^`]*)`', r'notes: `\1`', content)
content = re.sub(r'comments:\s*([a-zA-Z0-9_\.\?\s]+),', r'notes: \1,', content)

# Replace sample_notes payload
content = re.sub(r'\s*author_id:\s*[^,]+,', '', content)
content = re.sub(r'\s*author_name:\s*currentName,', '', content)
content = content.replace('comment: note.text', 'note: note.text')

with open('src/hooks/use-samples-core.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print('Replacements done.')
