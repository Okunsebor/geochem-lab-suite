import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;
import { parse } from 'pg-connection-string';

async function deploySchema() {
  // Read connection string from environment variable or args
  const connectionString = process.env.DATABASE_URL || process.argv[2];

  if (!connectionString) {
    console.error('Error: Please provide your Supabase Postgres connection string.');
    console.error('Usage: node deploy_schema.js "postgres://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"');
    process.exit(1);
  }

  const config = parse(connectionString);
  config.ssl = {
    rejectUnauthorized: false
  };

  const client = new Client(config);

  try {
    console.log('Connecting to database...');
    await client.connect();
    
    console.log('Reading consolidated_schema.sql...');
    const schemaSql = fs.readFileSync('consolidated_schema.sql', 'utf8');

    console.log('Executing schema...');
    // We execute the whole schema as a single command. 
    // Since we added IF NOT EXISTS and DO blocks, this should safely apply on top of the existing schema.
    await client.query(schemaSql);

    console.log('✅ Schema successfully deployed to Supabase!');
  } catch (err) {
    console.error('❌ Failed to deploy schema:', err.message);
  } finally {
    await client.end();
  }
}

deploySchema();
