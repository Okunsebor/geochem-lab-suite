import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;
import { parse } from 'pg-connection-string';

function splitStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    
    // Check for dollar quoting (e.g., $$ or $tag$)
    if (char === '$') {
      // Look ahead to see if it's a dollar quote
      let j = i + 1;
      while (j < sql.length && sql[j] !== '$' && /[a-zA-Z0-9_]/.test(sql[j])) {
        j++;
      }
      if (j < sql.length && sql[j] === '$') {
        const tag = sql.substring(i, j + 1);
        if (!inDollarQuote) {
          inDollarQuote = true;
          dollarTag = tag;
        } else if (tag === dollarTag) {
          inDollarQuote = false;
          dollarTag = '';
        }
        current += tag;
        i = j;
        continue;
      }
    }

    if (char === ';' && !inDollarQuote) {
      current += ';';
      if (current.trim()) {
        statements.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

async function deployDebug() {
  const connectionString = process.env.DATABASE_URL || process.argv[2];

  if (!connectionString) {
    console.error('Error: Please provide connection string.');
    process.exit(1);
  }

  const config = parse(connectionString);
  config.ssl = { rejectUnauthorized: false };
  const client = new Client(config);

  try {
    console.log('Connecting to database...');
    await client.connect();

    console.log('Reading consolidated_schema.sql...');
    const schemaSql = fs.readFileSync('consolidated_schema.sql', 'utf8');

    console.log('Splitting into statements...');
    const statements = splitStatements(schemaSql);
    console.log(`Found ${statements.length} statements.`);

    console.log('Executing statements one by one...');
    for (let idx = 0; idx < statements.length; idx++) {
      const stmt = statements[idx];
      // Print first line or snippet of statement for context
      const snippet = stmt.split('\n')[0].substring(0, 80);
      try {
        await client.query(stmt);
      } catch (err) {
        console.error(`\n❌ Error executing statement #${idx + 1}:`);
        console.error('--- STATEMENT START ---');
        console.error(stmt);
        console.error('--- STATEMENT END ---');
        console.error(`Error Message: ${err.message}`);
        console.error(`Error Code: ${err.code}`);
        process.exit(1);
      }
    }

    console.log('\n✅ All statements successfully executed!');
  } catch (err) {
    console.error('Fatal deployment error:', err.message);
  } finally {
    await client.end();
  }
}

deployDebug();
