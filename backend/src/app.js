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

// Global Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));
app.use(express.json());
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

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

