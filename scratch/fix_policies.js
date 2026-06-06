import fs from 'fs';

function fixPolicies() {
  const filePath = 'consolidated_schema.sql';
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex to find CREATE POLICY "name" ON table
  const createPolicyRegex = /CREATE POLICY\s+"([^"]+)"\s+ON\s+([a-zA-Z0-9_\.]+)/gi;
  
  // We'll find all matches
  let match;
  const matches = [];
  while ((match = createPolicyRegex.exec(content)) !== null) {
    matches.push({
      fullMatch: match[0],
      policyName: match[1],
      tableName: match[2],
      index: match.index
    });
  }

  // Iterate backwards to make string replacements without messing up indices
  let modifiedContent = content;
  for (let i = matches.length - 1; i >= 0; i--) {
    const { fullMatch, policyName, tableName, index } = matches[i];
    
    // Check if a DROP POLICY statement already exists for this policy and table in the preceding ~300 characters
    const lookbackStart = Math.max(0, index - 300);
    const lookbackText = modifiedContent.substring(lookbackStart, index);
    
    const dropPattern = new RegExp(`DROP\\s+POLICY\\s+(?:IF\\s+EXISTS\\s+)?(?:I|i)?["]?${escapeRegExp(policyName)}["]?\\s+ON\\s+${escapeRegExp(tableName)}`, 'i');
    
    if (!dropPattern.test(lookbackText)) {
      console.log(`Adding DROP POLICY for "${policyName}" ON ${tableName}`);
      const dropStmt = `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};\n`;
      
      // Insert drop statement before the CREATE POLICY statement
      modifiedContent = modifiedContent.substring(0, index) + dropStmt + modifiedContent.substring(index);
    } else {
      console.log(`DROP POLICY already exists for "${policyName}" ON ${tableName}`);
    }
  }

  fs.writeFileSync(filePath, modifiedContent, 'utf8');
  console.log('✅ Polices updated successfully in consolidated_schema.sql!');
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

fixPolicies();
