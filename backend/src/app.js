const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const { swaggerDoc } = require('./docs/swaggerDoc');
const { errorHandler } = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const operatorsRoutes = require('./modules/operators/operators.routes');
const busesRoutes = require('./modules/buses/buses.routes');
const routesRoutes = require('./modules/routes/routes.routes');
const tripsRoutes = require('./modules/trips/trips.routes');
const bookingsRoutes = require('./modules/bookings/bookings.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const auditRoutes = require('./modules/audit/audit.routes');

const app = express();
const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim().replace(/\/+$/, ''))
  : ['*'];

// Global Middlewares
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
      return callback(null, origin);
    }
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, origin);
    }
    if (/^https:\/\/.*\.vercel\.app$/.test(origin)) {
      return callback(null, origin);
    }
    return callback(null, configuredOrigins[0] || false);
  },
  credentials: true,
}));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Root status / API entrypoint
app.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Bus Booking Management System API is operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      docs: '/api/docs',
      docsJson: '/api/docs.json',
      auth: '/api/auth',
      trips: '/api/trips',
      bookings: '/api/bookings',
      buses: '/api/buses',
      routes: '/api/routes',
      operators: '/api/operators',
      reports: '/api/reports',
      audit: '/api/audit',
    },
  });
});

// Root-level health check endpoint (pinged by cloud uptime monitors)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Bus Booking Management System API',
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Bus Booking Management System API',
  });
});

// Interactive Swagger UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, {
  explorer: true,
  persistAuthorization: true,
  displayRequestDuration: true,
}));
app.get('/api/docs.json', (req, res) => res.json(swaggerDoc));

// Mount Modules
app.use('/api/auth', authRoutes);
app.use('/api/operators', operatorsRoutes);
app.use('/api/buses', busesRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/trips', tripsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit', auditRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;

