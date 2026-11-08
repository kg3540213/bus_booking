const app = require('./app');
const { pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Test DB connection before listening
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Failed to connect to PostgreSQL database:', err.message);
    console.error('Ensure PostgreSQL is running (e.g., docker compose up postgres)');
  } else {
    console.log('PostgreSQL database connected at:', res.rows[0].now);
  }
});

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` Bus Booking Management System Backend API Started `);
  console.log(` Port: ${PORT}`);
  console.log(` API Docs: http://localhost:${PORT}/api/docs`);
  console.log(` Health:   http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    pool.end();
  });
});

