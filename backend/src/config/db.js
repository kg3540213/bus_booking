const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

let connectionString = process.env.DATABASE_URL;

// When running locally outside of Render, internal Render hostname (dpg-*-a)
// resolves via the external domain suffix (.oregon-postgres.render.com)
if (connectionString && process.env.RENDER !== 'true') {
  connectionString = connectionString.replace(
    /@(dpg-[a-z0-9]+-a)(?::\d+)?\//,
    '@$1.oregon-postgres.render.com/'
  );
}

const isRemoteDb = Boolean(
  connectionString &&
  !connectionString.includes('localhost') &&
  !connectionString.includes('127.0.0.1')
);

const connectionConfig = connectionString
  ? {
      connectionString,
      ...(isRemoteDb ? { ssl: { rejectUnauthorized: false } } : {}),
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      user: process.env.DB_USER || 'bus_admin',
      password: process.env.DB_PASSWORD || 'bus_secure_pass',
      database: process.env.DB_NAME || 'bus_booking_db',
    };

const pool = new Pool({
  ...connectionConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
};

