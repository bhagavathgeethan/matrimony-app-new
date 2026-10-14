const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection config
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Stu@123',
  host: process.env.DB_HOST || '187.127.178.200',
  port: parseInt(process.env.DB_PORT || '5444', 10),
  database: process.env.DB_NAME || 'ab_matrimony',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('connect', () => {
  // Connected
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
