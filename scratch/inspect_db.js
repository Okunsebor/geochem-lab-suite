import pkg from 'pg';
const { Client } = pkg;
import { parse } from 'pg-connection-string';

async function inspectDb() {
  const connectionString = process.env.DATABASE_URL || process.argv[2];
  if (!connectionString) {
    console.error('Please provide connection string');
    process.exit(1);
  }

  const config = parse(connectionString);
  config.ssl = { rejectUnauthorized: false };
  const client = new Client(config);

  try {
    await client.connect();
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM public.sample_attachments) as total_rows,
        (SELECT COUNT(*) FROM public.sample_attachments WHERE sample_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$') as invalid_uuid_count;
    `;
    const res = await client.query(query);
    console.log('--- Table sample_attachments stats ---');
    console.table(res.rows);
  } catch (err) {
    console.error('Inspection failed:', err.message);
  } finally {
    await client.end();
  }
}

inspectDb();
