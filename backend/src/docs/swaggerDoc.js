const swaggerDoc = {
  openapi: '3.0.3',
  info: {
    title: 'Bus Booking Management System API',
    version: '1.0.0',
    description: 'Algions AI Labs - Full-Stack Bus Booking System API documentation with RBAC, seat concurrency locking, cancellation refunds, and operator manifests.',
    contact: {
      name: 'Engineering Team',
      email: 'engineering@algions.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT bearer token returned by /api/auth/login or /api/auth/demo-login'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Error message description' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'John Doe' },
          email: { type: 'string', example: 'user@example.com' },
          role: { type: 'string', enum: ['ADMIN', 'OPERATOR', 'CUSTOMER'], example: 'CUSTOMER' }
        }
      },
      TripSearchItem: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          departure_time: { type: 'string', format: 'date-time' },
          arrival_time: { type: 'string', format: 'date-time' },
          base_fare: { type: 'number', example: 1250 },
          source_city: { type: 'string', example: 'Bangalore' },
          destination_city: { type: 'string', example: 'Hyderabad' },
          bus_number: { type: 'string', example: 'KA-01-AG-2026' },
          bus_type: { type: 'string', example: 'AC_SLEEPER' },
          available_seats: { type: 'integer', example: 28 },
          total_seats: { type: 'integer', example: 30 }
        }
      },
      BookingRequest: {
        type: 'object',
        required: ['trip_id', 'selected_seats', 'passengers', 'primary_contact_name', 'primary_contact_email', 'primary_contact_phone'],
        properties: {
          trip_id: { type: 'integer', example: 1 },
          selected_seats: { type: 'array', items: { type: 'string' }, example: ['L1', 'L2'] },
          passengers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                seat_number: { type: 'string', example: 'L1' },
                passenger_name: { type: 'string', example: 'Alice Smith' },
                passenger_age: { type: 'integer', example: 28 },
                passenger_gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'], example: 'FEMALE' }
              }
            }
          },
          primary_contact_name: { type: 'string', example: 'Alice Smith' },
          primary_contact_email: { type: 'string', example: 'alice@example.com' },
          primary_contact_phone: { type: 'string', example: '+91 98765 43210' },
          boarding_stop_id: { type: 'integer', example: 1 },
          dropping_stop_id: { type: 'integer', example: 5 },
          idempotency_key: { type: 'string', example: 'idem-uuid-984210' }
        }
      }
    }
  },
  paths: {
    '/api/auth/login': {
      post: {
        summary: 'User Login',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@algions.com' },
                  password: { type: 'string', example: 'Admin@123' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Login successful, returns JWT' },
          401: { description: 'Invalid credentials' }
        }
      }
    },
    '/api/auth/demo-login': {
      post: {
        summary: 'Quick Demo Switcher Login for Reviewers',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['ADMIN', 'OPERATOR', 'CUSTOMER'], example: 'ADMIN' }
                }
              }
            }
          }
        },
        responses: {
          200: { description: 'Authenticated as requested role' }
        }
      }
    },
    '/api/trips/search': {
      get: {
        summary: 'Search Available Trips with Filters',
        tags: ['Trips'],
        parameters: [
          { name: 'source', in: 'query', schema: { type: 'string' }, description: 'Departure city e.g. Bangalore' },
          { name: 'destination', in: 'query', schema: { type: 'string' }, description: 'Arrival city e.g. Hyderabad' },
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Travel date (YYYY-MM-DD)' },
          { name: 'bus_type', in: 'query', schema: { type: 'string' } },
          { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'departure_asc', 'duration_asc'] } }
        ],
        responses: {
          200: { description: 'List of matching trips with live seat availability' }
        }
      }
    },
    '/api/trips/{id}': {
      get: {
        summary: 'Get Trip Details & Interactive Seat Layout',
        tags: ['Trips'],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Trip details with lower/upper deck seats and stops' },
          404: { description: 'Trip not found' }
        }
      }
    },
    '/api/bookings': {
      post: {
        summary: 'Book Seat(s) with Row-Level Lock & Concurrency Protection',
        tags: ['Bookings'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BookingRequest' }
            }
          }
        },
        responses: {
          201: { description: 'Booking confirmed with unique PNR' },
          409: { description: 'Seat collision / concurrent double booking conflict' },
          400: { description: 'Validation error' }
        }
      }
    },
    '/api/bookings/pnr/{pnr}': {
      get: {
        summary: 'Public PNR Ticket Lookup & Boarding Pass Details',
        tags: ['Bookings'],
        parameters: [
          { name: 'pnr', in: 'path', required: true, schema: { type: 'string' }, example: 'PNR-ALG-984210' }
        ],
        responses: {
          200: { description: 'Confirmed ticket details' },
          404: { description: 'PNR not found' }
        }
      }
    },
    '/api/bookings/{id}/cancel': {
      post: {
        summary: 'Cancel Booking & Release Seats Back to Available',
        tags: ['Bookings'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Booking cancelled, seats released to inventory, refund calculated & processed' },
          400: { description: 'Cannot cancel' }
        }
      }
    },
    '/api/reports/trips/{tripId}/manifest': {
      get: {
        summary: 'Trip Passenger Manifest & Reconciled Occupancy',
        tags: ['Reports'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tripId', in: 'path', required: true, schema: { type: 'integer' } }
        ],
        responses: {
          200: { description: 'Confirmed passenger list and seat reconciliation' }
        }
      }
    },
    '/api/reports/occupancy': {
      get: {
        summary: 'Fleet Occupancy & Capacity Utilization Report',
        tags: ['Reports'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Occupancy statistics across scheduled trips' }
        }
      }
    },
    '/api/audit': {
      get: {
        summary: 'Audit Trail of Material Business Operations (Admin only)',
        tags: ['Audit'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Audit trail records' }
        }
      }
    }
  }
};

module.exports = { swaggerDoc };
