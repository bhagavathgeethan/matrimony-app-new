const { Client } = require('pg');

async function testConnection() {
  console.log('Testing connection to PostgreSQL server at 187.127.178.200:5444...');

  // Try 1: Connect to UAT_db first
  const clientUAT = new Client({
    user: 'postgres',
    password: 'Stu@123',
    host: '187.127.178.200',
    port: 5444,
    database: 'UAT_db',
    connectionTimeoutMillis: 10000,
  });

  try {
    await clientUAT.connect();
    console.log('✓ Successfully connected to PostgreSQL server (database: UAT_db)!');
    
    // Check if ab_matrimony database exists
    const res = await clientUAT.query("SELECT datname FROM pg_database WHERE datname = 'ab_matrimony';");
    if (res.rows.length > 0) {
      console.log('✓ Database "ab_matrimony" exists!');
    } else {
      console.log('Database "ab_matrimony" does not exist yet in UAT_db server. Attempting to create it...');
      try {
        await clientUAT.query('CREATE DATABASE ab_matrimony;');
        console.log('✓ Successfully created database "ab_matrimony"!');
      } catch (createErr) {
        console.log('Could not create ab_matrimony:', createErr.message);
      }
    }
    await clientUAT.end();
  } catch (err) {
    console.error('Connection to UAT_db failed:', err.message);
  }

  // Try 2: Connect directly to ab_matrimony
  console.log('\nTesting direct connection to "ab_matrimony"...');
  const clientMatrimony = new Client({
    user: 'postgres',
    password: 'Stu@123',
    host: '187.127.178.200',
    port: 5444,
    database: 'ab_matrimony',
    connectionTimeoutMillis: 10000,
  });

  try {
    await clientMatrimony.connect();
    console.log('✓ Successfully connected to PostgreSQL database "ab_matrimony"!');
    const versionRes = await clientMatrimony.query('SELECT version();');
    console.log('PostgreSQL Version:', versionRes.rows[0].version);
    await clientMatrimony.end();
  } catch (err) {
    console.error('Connection to ab_matrimony failed:', err.message);
  }
}

testConnection();
