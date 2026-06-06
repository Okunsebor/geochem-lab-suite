import pkg from 'pg';
const { Client } = pkg;
// pg-connection-string is a dependency of pg, but in newer versions we can parse it using pg's helper or manually.
// Let's import pg-connection-string.
import { parse } from 'pg-connection-string';

async function testConn() {
  const connectionString = process.argv[2];
  if (!connectionString) {
    console.error('Please provide connection string');
    process.exit(1);
  }

  const config = parse(connectionString);
  console.log('Parsed config:', {
    ...config,
    password: config.password ? '***' : null
  });

  // Explicitly configure SSL to rejectUnauthorized: false
  config.ssl = {
    rejectUnauthorized: false
  };

  const client = new Client(config);
  try {
    console.log('Connecting to', config.host);
    await client.connect();
    const res = await client.query('SELECT version();');
    console.log('✅ Connected successfully!');
    console.log(res.rows[0]);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.end();
  }
}

testConn();
