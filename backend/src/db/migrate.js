const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runMigration() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Running database schema migration...');
  let client;
  let transactionStarted = false;

  try {
    client = await pool.connect();
    await client.query('BEGIN');
    transactionStarted = true;
    await client.query(sql);
    await client.query('COMMIT');
    transactionStarted = false;
    console.log('Database schema migration completed successfully!');
  } catch (err) {
    if (client && transactionStarted) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Migration rollback failed:', rollbackError);
      }
    }
    console.error('Migration failed:', err);
    throw err;
  } finally {
    if (client) {
      client.release();
    }
  }
}

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { runMigration };

