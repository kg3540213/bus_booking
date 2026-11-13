const idParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'integer', minimum: 1 },
};

const successResponse = (description, schema) => ({
  description,
  ...(schema ? {
    content: {
      'application/json': {
        schema,
      },
    },
  } : {}),
});

const errorResponse = (description) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
});

const dataResponse = (description, schema) => successResponse(description, {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: schema,
  },
});

const swaggerDoc = {
  openapi: '3.0.3',
  info: {
    title: 'NexBus Bus Booking Management API',
    version: '1.0.0',
    description: [
      'REST API for bus discovery, bookings, operators, fleet operations, and reporting.',
      'Public operations do not require a token. For protected operations, authenticate with a JWT returned by the login, registration, or demo-login endpoint.',
      'Access is enforced by server-side role-based authorization. Customers can only access their own bookings; operators are restricted to their own fleet and trips.',
    ].join('\n\n'),
  },
  servers: [
    {
      url: '/',
      description: 'Current API host',
    },
  ],
  tags: [
    { name: 'System', description: 'Service status and liveness' },
    { name: 'Authentication', description: 'Account registration, login, and profile' },
    { name: 'Operators', description: 'Transit operator directory and administration' },
    { name: 'Buses', description: 'Bus fleet and seat layouts' },
    { name: 'Routes', description: 'Route directory, city list, and stops' },
    { name: 'Trips', description: 'Trip search, schedules, and seat availability' },
    { name: 'Bookings', description: 'Booking, ticket lookup, and cancellation' },
    { name: 'Reports', description: 'Staff dashboards, occupancy, and passenger manifests' },
    { name: 'Audit', description: 'Administrative audit trail' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste the token returned in the authentication response. Do not include the "Bearer " prefix.',
      },
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Resource not found' },
          details: {
            description: 'Optional validation details or database error detail.',
            nullable: true,
            oneOf: [
              { type: 'array', items: { type: 'object', additionalProperties: true } },
              { type: 'string' },
            ],
          },
          booked_seats: {
            type: 'array',
            items: { type: 'string' },
            description: 'Present when a booking fails because selected seats are no longer available.',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          name: { type: 'string', example: 'Asha Kumar' },
          email: { type: 'string', format: 'email', example: 'asha@example.com' },
          phone: { type: 'string', nullable: true, example: '+91 98765 43210' },
          role: { type: 'string', enum: ['ADMIN', 'OPERATOR', 'CUSTOMER'] },
          operator_id: { type: 'integer', nullable: true },
          operator_name: { type: 'string' },
          operator_code: { type: 'string' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/User' },
              token: { type: 'string', description: 'JWT bearer token' },
            },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 2, example: 'Asha Kumar' },
          email: { type: 'string', format: 'email', example: 'asha@example.com' },
          password: { type: 'string', minLength: 6, format: 'password' },
          phone: { type: 'string', example: '+91 98765 43210' },
          role: { type: 'string', enum: ['CUSTOMER', 'OPERATOR'], default: 'CUSTOMER' },
          company_name: { type: 'string', description: 'Optional; used when registering as an operator.' },
          company_code: { type: 'string', description: 'Optional operator code.' },
          company_phone: { type: 'string' },
          company_address: { type: 'string' },
        },
      },
      Operator: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          code: { type: 'string' },
          contact_email: { type: 'string', format: 'email' },
          contact_phone: { type: 'string' },
          address: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
          total_buses: { type: 'integer' },
          buses: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
      },
      OperatorRequest: {
        type: 'object',
        required: ['name', 'code', 'contact_email', 'contact_phone'],
        properties: {
          name: { type: 'string', minLength: 2 },
          code: { type: 'string', minLength: 2, maxLength: 10 },
          contact_email: { type: 'string', format: 'email' },
          contact_phone: { type: 'string', minLength: 8 },
          address: { type: 'string' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
        },
      },
      Bus: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          operator_id: { type: 'integer' },
          operator_name: { type: 'string' },
          operator_code: { type: 'string' },
          bus_number: { type: 'string' },
          model: { type: 'string' },
          bus_type: {
            type: 'string',
            enum: ['AC_SLEEPER', 'AC_SEATER', 'NON_AC_SEATER', 'NON_AC_SLEEPER', 'VOLVO_MULTI_AXLE'],
          },
          total_seats: { type: 'integer' },
          amenities: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED'] },
          seats: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
      },
      BusRequest: {
        type: 'object',
        required: ['operator_id', 'bus_number', 'model', 'bus_type', 'total_seats'],
        properties: {
          operator_id: { type: 'integer', minimum: 1 },
          bus_number: { type: 'string', minLength: 3 },
          model: { type: 'string', minLength: 2 },
          bus_type: {
            type: 'string',
            enum: ['AC_SLEEPER', 'AC_SEATER', 'NON_AC_SEATER', 'NON_AC_SLEEPER', 'VOLVO_MULTI_AXLE'],
          },
          total_seats: { type: 'integer', minimum: 10, maximum: 60 },
          amenities: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['ACTIVE', 'MAINTENANCE', 'DECOMMISSIONED'] },
        },
      },
      RouteStopRequest: {
        type: 'object',
        required: ['stop_name', 'stop_type', 'sequence_order', 'time_offset_mins'],
        properties: {
          stop_name: { type: 'string', minLength: 2 },
          stop_type: { type: 'string', enum: ['BOARDING', 'DROPPING', 'BOTH'] },
          sequence_order: { type: 'integer', minimum: 1 },
          time_offset_mins: { type: 'integer', minimum: 0 },
          landmark: { type: 'string' },
        },
      },
      RouteRequest: {
        type: 'object',
        required: ['source_city', 'destination_city', 'distance_km', 'estimated_duration_mins'],
        properties: {
          source_city: { type: 'string', minLength: 2 },
          destination_city: { type: 'string', minLength: 2 },
          distance_km: { type: 'number', minimum: 0, exclusiveMinimum: true },
          estimated_duration_mins: { type: 'integer', minimum: 1 },
          stops: { type: 'array', items: { $ref: '#/components/schemas/RouteStopRequest' } },
        },
      },
      TripRequest: {
        type: 'object',
        required: ['bus_id', 'route_id', 'departure_time', 'arrival_time', 'base_fare'],
        properties: {
          bus_id: { type: 'integer', minimum: 1 },
          route_id: { type: 'integer', minimum: 1 },
          departure_time: { type: 'string', format: 'date-time' },
          arrival_time: { type: 'string', format: 'date-time' },
          base_fare: { type: 'number', minimum: 0, exclusiveMinimum: true },
        },
      },
      PassengerRequest: {
        type: 'object',
        required: ['seat_number'],
        properties: {
          seat_number: { type: 'string', example: 'L1' },
          passenger_name: { type: 'string', example: 'Asha Kumar' },
          passenger_age: { type: 'integer', minimum: 1, maximum: 120, example: 28 },
          passenger_gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
        },
      },
      BookingRequest: {
        type: 'object',
        required: ['trip_id', 'selected_seats', 'passengers'],
        properties: {
          trip_id: { type: 'integer', minimum: 1 },
          selected_seats: {
            type: 'array',
            minItems: 1,
            items: { type: 'string' },
            example: ['L1', 'L2'],
          },
          passengers: {
            type: 'array',
            minItems: 1,
            items: { $ref: '#/components/schemas/PassengerRequest' },
          },
          primary_contact_name: { type: 'string', example: 'Asha Kumar' },
          primary_contact_email: { type: 'string', format: 'email', example: 'asha@example.com' },
          primary_contact_phone: { type: 'string', example: '+91 98765 43210' },
          boarding_stop_id: { type: 'integer', nullable: true },
          dropping_stop_id: { type: 'integer', nullable: true },
          idempotency_key: { type: 'string', nullable: true },
          payment_method: { type: 'string' },
          discount_amount: { type: 'number' },
        },
      },
      TripSearchResult: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          departure_time: { type: 'string', format: 'date-time' },
          arrival_time: { type: 'string', format: 'date-time' },
          base_fare: { type: 'number' },
          status: { type: 'string' },
          duration_mins: { type: 'integer' },
          route_id: { type: 'integer' },
          source_city: { type: 'string' },
          destination_city: { type: 'string' },
          bus_id: { type: 'integer' },
          bus_number: { type: 'string' },
          bus_model: { type: 'string' },
          bus_type: { type: 'string' },
          amenities: { type: 'array', items: { type: 'string' } },
          operator_id: { type: 'integer' },
          operator_name: { type: 'string' },
          operator_code: { type: 'string' },
          available_seats: { type: 'integer' },
          total_seats: { type: 'integer' },
          starting_fare: { type: 'number', nullable: true },
          stops: { type: 'array', items: { type: 'object', additionalProperties: true }, nullable: true },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          pnr: { type: 'string', example: 'PNR-NBX-123456' },
          user_id: { type: 'integer' },
          trip_id: { type: 'integer' },
          total_fare: { type: 'number' },
          status: { type: 'string', enum: ['CONFIRMED', 'CANCELLED'] },
          primary_contact_name: { type: 'string' },
          primary_contact_email: { type: 'string', format: 'email' },
          primary_contact_phone: { type: 'string' },
          passengers: { type: 'array', items: { type: 'object', additionalProperties: true }, nullable: true },
          refunds: { type: 'array', items: { type: 'object', additionalProperties: true }, nullable: true },
        },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        operationId: 'getHealth',
        summary: 'Check API health',
        tags: ['System'],
        responses: {
          200: successResponse('API is healthy', {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'healthy' },
              timestamp: { type: 'string', format: 'date-time' },
              service: { type: 'string', example: 'Bus Booking Management System API' },
            },
          }),
        },
      },
    },
    '/api/auth/register': {
      post: {
        operationId: 'register',
        summary: 'Register a customer or operator account',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          201: successResponse('Account created and JWT returned', {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              message: { type: 'string' },
              data: {
                type: 'object',
                properties: {
                  user: { $ref: '#/components/schemas/User' },
                  token: { type: 'string', description: 'JWT bearer token' },
                },
              },
            },
          }),
          400: errorResponse('Invalid registration payload'),
          409: errorResponse('Email address is already registered'),
        },
      },
    },
    '/api/auth/login': {
      post: {
        operationId: 'login',
        summary: 'Authenticate with email and password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 1, format: 'password' },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse('Authenticated; response includes a JWT', { $ref: '#/components/schemas/AuthResponse' }),
          400: errorResponse('Invalid request payload'),
          401: errorResponse('Email or password is invalid'),
        },
      },
    },
    '/api/auth/demo-login': {
      post: {
        operationId: 'demoLogin',
        summary: 'Sign in to a seeded reviewer account',
        description: 'Convenience endpoint for local/demo review; returns 404 if the requested demo account is not seeded.',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['ADMIN', 'OPERATOR', 'CUSTOMER'] },
                },
              },
            },
          },
        },
        responses: {
          200: successResponse('Demo account authenticated', { $ref: '#/components/schemas/AuthResponse' }),
          404: errorResponse('Demo account for the requested role was not found'),
        },
      },
    },
    '/api/auth/me': {
      get: {
        operationId: 'getProfile',
        summary: 'Get the authenticated user profile',
        tags: ['Authentication'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: dataResponse('Profile returned', { $ref: '#/components/schemas/User' }),
          401: errorResponse('Authentication is required or the token is invalid'),
          404: errorResponse('User profile not found'),
        },
      },
    },
    '/api/operators': {
      get: {
        operationId: 'listOperators',
        summary: 'List operators',
        tags: ['Operators'],
        responses: {
          200: dataResponse('Operator list returned', { type: 'array', items: { $ref: '#/components/schemas/Operator' } }),
        },
      },
      post: {
        operationId: 'createOperator',
        summary: 'Create an operator',
        tags: ['Operators'],
        security: [{ bearerAuth: [] }],
        description: 'Requires the ADMIN role.',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OperatorRequest' } } },
        },
        responses: {
          201: dataResponse('Operator created', { $ref: '#/components/schemas/Operator' }),
          400: errorResponse('Invalid operator payload'),
          401: errorResponse('Authentication is required'),
          403: errorResponse('The caller is not an administrator'),
        },
      },
    },
    '/api/operators/{id}': {
      get: {
        operationId: 'getOperator',
        summary: 'Get an operator and its buses',
        tags: ['Operators'],
        parameters: [idParameter],
        responses: {
          200: dataResponse('Operator details returned', { $ref: '#/components/schemas/Operator' }),
          404: errorResponse('Operator not found'),
        },
      },
      put: {
        operationId: 'updateOperator',
        summary: 'Update an operator',
        tags: ['Operators'],
        description: 'Requires ADMIN or OPERATOR. Operators can update only their own operator record.',
        security: [{ bearerAuth: [] }],
        parameters: [idParameter],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', minLength: 2 },
                  code: { type: 'string', minLength: 2, maxLength: 10 },
                  contact_email: { type: 'string', format: 'email' },
                  contact_phone: { type: 'string', minLength: 8 },
                  address: { type: 'string' },
                  status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] },
                },
              },
            },
          },
        },
        responses: {
          200: dataResponse('Operator updated', { $ref: '#/components/schemas/Operator' }),
          400: errorResponse('Invalid operator payload'),
          401: errorResponse('Authentication is required'),
          403: errorResponse('The caller cannot update this operator'),
          404: errorResponse('Operator not found'),
        },
      },
    },
    '/api/buses': {
      get: {
        operationId: 'listBuses',
        summary: 'List buses',
        tags: ['Buses'],
        parameters: [
          { name: 'operator_id', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'bus_type', in: 'query', schema: { type: 'string', enum: ['AC_SLEEPER', 'AC_SEATER', 'NON_AC_SEATER', 'NON_AC_SLEEPER', 'VOLVO_MULTI_AXLE'] } },
        ],
        responses: {
          200: dataResponse('Bus list returned', { type: 'array', items: { $ref: '#/components/schemas/Bus' } }),
        },
      },
      post: {
        operationId: 'createBus',
        summary: 'Create a bus and generate its seat layout',
        tags: ['Buses'],
        description: 'Requires ADMIN or OPERATOR. An operator can add buses only to its own operator account.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BusRequest' } } },
        },
        responses: {
          201: dataResponse('Bus created', { $ref: '#/components/schemas/Bus' }),
          400: errorResponse('Invalid bus payload or operator reference'),
          401: errorResponse('Authentication is required'),
          403: errorResponse('The caller cannot create a bus for this operator'),
        },
      },
    },
    '/api/buses/{id}': {
      get: {
        operationId: 'getBus',
        summary: 'Get bus details and seat layout',
        tags: ['Buses'],
        parameters: [idParameter],
        responses: {
          200: dataResponse('Bus details returned', { $ref: '#/components/schemas/Bus' }),
          404: errorResponse('Bus not found'),
        },
      },
    },
    '/api/routes/cities': {
      get: {
        operationId: 'listCities',
        summary: 'List distinct cities on active routes',
        tags: ['Routes'],
        responses: {
          200: dataResponse('City list returned', { type: 'array', items: { type: 'string' } }),
        },
      },
    },
    '/api/routes': {
      get: {
        operationId: 'listRoutes',
        summary: 'List active routes',
        tags: ['Routes'],
        parameters: [
          { name: 'source', in: 'query', schema: { type: 'string' } },
          { name: 'destination', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: dataResponse('Route list returned', { type: 'array', items: { type: 'object', additionalProperties: true } }),
        },
      },
      post: {
        operationId: 'createRoute',
        summary: 'Create a route with optional stops',
        tags: ['Routes'],
        description: 'Requires ADMIN or OPERATOR.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RouteRequest' } } },
        },
        responses: {
          201: dataResponse('Route created', { type: 'object', additionalProperties: true }),
          400: errorResponse('Invalid route payload'),
          401: errorResponse('Authentication is required'),
          403: errorResponse('The caller does not have permission to create routes'),
        },
      },
    },
    '/api/routes/{id}': {
      get: {
        operationId: 'getRoute',
        summary: 'Get route details and ordered stops',
        tags: ['Routes'],
        parameters: [idParameter],
        responses: {
          200: dataResponse('Route details returned', { type: 'object', additionalProperties: true }),
          404: errorResponse('Route not found'),
        },
      },
    },
    '/api/trips/search': {
      get: {
        operationId: 'searchTrips',
        summary: 'Search trips and current seat availability',
        tags: ['Trips'],
        parameters: [
          { name: 'source', in: 'query', schema: { type: 'string' }, description: 'Partial source city match.' },
          { name: 'destination', in: 'query', schema: { type: 'string' }, description: 'Partial destination city match.' },
          { name: 'date', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Departure date (YYYY-MM-DD).' },
          { name: 'bus_type', in: 'query', schema: { type: 'string', enum: ['AC_SLEEPER', 'AC_SEATER', 'NON_AC_SEATER', 'NON_AC_SLEEPER', 'VOLVO_MULTI_AXLE'] } },
          { name: 'operator_id', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'min_price', in: 'query', schema: { type: 'number', minimum: 0 } },
          { name: 'max_price', in: 'query', schema: { type: 'number', minimum: 0 } },
          { name: 'departure_time_of_day', in: 'query', schema: { type: 'string', enum: ['morning', 'afternoon', 'evening', 'night'] } },
          { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['price_asc', 'price_desc', 'departure_asc', 'duration_asc'] } },
        ],
        responses: {
          200: successResponse('Matching trips returned', {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              count: { type: 'integer' },
              data: { type: 'array', items: { $ref: '#/components/schemas/TripSearchResult' } },
            },
          }),
        },
      },
    },
    '/api/trips/{id}': {
      get: {
        operationId: 'getTrip',
        summary: 'Get trip details, seats, and route stops',
        tags: ['Trips'],
        parameters: [idParameter],
        responses: {
          200: dataResponse('Trip details returned', { type: 'object', additionalProperties: true }),
          404: errorResponse('Trip not found'),
        },
      },
    },
    '/api/trips': {
      post: {
        operationId: 'createTrip',
        summary: 'Schedule a trip',
        tags: ['Trips'],
        description: 'Requires ADMIN or OPERATOR. Operators can schedule only buses belonging to their account.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TripRequest' } } },
        },
        responses: {
          201: dataResponse('Trip created and trip seats initialized', { type: 'object', additionalProperties: true }),
          400: errorResponse('Invalid payload or arrival is not after departure'),
          401: errorResponse('Authentication is required'),
          403: errorResponse('The caller cannot schedule for this bus'),
          404: errorResponse('Bus not found'),
        },
      },
    },
    '/api/trips/{id}/status': {
      patch: {
        operationId: 'updateTripStatus',
        summary: 'Update a trip status',
        tags: ['Trips'],
        description: 'Requires ADMIN or OPERATOR.',
        security: [{ bearerAuth: [] }],
        parameters: [idParameter],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'] },
                },
              },
            },
          },
        },
        responses: {
          200: dataResponse('Trip status updated', { type: 'object', additionalProperties: true }),
          400: errorResponse('Invalid status'),
          401: errorResponse('Authentication is required'),
          403: errorResponse('The caller does not have permission to update trip status'),
          404: errorResponse('Trip not found'),
        },
      },
    },
    '/api/bookings': {
      post: {
        operationId: 'createBooking',
        summary: 'Book selected seats with transactional locking',
        description: 'Requires an authenticated user. Seat rows are locked during booking to prevent concurrent double-booking. Reusing an idempotency key returns the existing booking.',
        tags: ['Bookings'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BookingRequest' } } },
        },
        responses: {
          201: dataResponse('Booking confirmed with PNR', { $ref: '#/components/schemas/Booking' }),
          200: dataResponse('Existing booking returned for idempotency key', { $ref: '#/components/schemas/Booking' }),
          400: errorResponse('Invalid booking, seat selection, or trip status'),
          401: errorResponse('Authentication is required'),
          404: errorResponse('Trip not found'),
          409: errorResponse('Selected seat is already booked'),
        },
      },
    },
    '/api/bookings/pnr/{pnr}': {
      get: {
        operationId: 'getBookingByPnr',
        summary: 'Look up a ticket by PNR',
        description: 'Public lookup; no authentication is required.',
        tags: ['Bookings'],
        parameters: [
          {
            name: 'pnr',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'PNR-NBX-123456' },
          },
        ],
        responses: {
          200: dataResponse('Ticket and passenger details returned', { $ref: '#/components/schemas/Booking' }),
          404: errorResponse('PNR not found'),
        },
      },
    },
    '/api/bookings/my-bookings': {
      get: {
        operationId: 'getMyBookings',
        summary: 'List the authenticated user’s bookings',
        tags: ['Bookings'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: dataResponse('Booking history returned', { type: 'array', items: { $ref: '#/components/schemas/Booking' } }),
          401: errorResponse('Authentication is required'),
        },
      },
    },
    '/api/bookings/{id}/cancellation-quote': {
      get: {
        operationId: 'getCancellationQuote',
        summary: 'Preview cancellation refund and fee',
        description: 'Requires an authenticated user. Customer callers can request a quote only for their own booking.',
        tags: ['Bookings'],
        security: [{ bearerAuth: [] }],
        parameters: [idParameter],
        responses: {
          200: dataResponse('Cancellation quote returned', {
            type: 'object',
            properties: {
              booking_id: { type: 'integer' },
              pnr: { type: 'string' },
              total_fare: { type: 'number' },
              departure_time: { type: 'string', format: 'date-time' },
              quote: { type: 'object', additionalProperties: true },
            },
          }),
          400: errorResponse('Booking is already cancelled'),
          401: errorResponse('Authentication is required'),
          403: errorResponse('The caller cannot view this booking’s cancellation details'),
          404: errorResponse('Booking not found'),
        },
      },
    },
    '/api/bookings/{id}/cancel': {
      post: {
        operationId: 'cancelBooking',
        summary: 'Cancel a booking, release seats, and process its refund',
        tags: ['Bookings'],
        security: [{ bearerAuth: [] }],
        parameters: [idParameter],
        responses: {
          200: dataResponse('Booking cancelled and seats released', {
            type: 'object',
            properties: {
              booking_id: { type: 'integer' },
              pnr: { type: 'string' },
              released_seats: { type: 'array', items: { type: 'string' } },
              refund: { type: 'object', additionalProperties: true },
            },
          }),
          400: errorResponse('Booking cannot be cancelled or trip has departed'),
          401: errorResponse('Authentication is required'),
          403: errorResponse('The caller cannot cancel this booking'),
          404: errorResponse('Booking not found'),
        },
      },
    },
    '/api/reports/dashboard': {
      get: {
        operationId: 'getDashboard',
        summary: 'Get dashboard metrics and recent bookings',
        description: 'Requires ADMIN or OPERATOR. Operator metrics are restricted to that operator’s fleet.',
        tags: ['Reports'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: dataResponse('Dashboard summary returned', {
            type: 'object',
            properties: {
              summary: { type: 'object', additionalProperties: true },
              recent_bookings: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          }),
          401: errorResponse('Authentication is required'),
          403: errorResponse('ADMIN or OPERATOR role is required'),
        },
      },
    },
    '/api/reports/occupancy': {
      get: {
        operationId: 'getOccupancyReport',
        summary: 'Get occupancy and confirmed revenue by trip',
        description: 'Requires ADMIN or OPERATOR. Operators automatically see only their own fleet.',
        tags: ['Reports'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'operator_id', in: 'query', schema: { type: 'integer', minimum: 1 }, description: 'ADMIN filter; operator role is scoped to its own operator_id.' },
          { name: 'route_id', in: 'query', schema: { type: 'integer', minimum: 1 } },
          { name: 'from_date', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'to_date', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: successResponse('Occupancy report returned (maximum 50 trips)', {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              count: { type: 'integer' },
              data: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          }),
          401: errorResponse('Authentication is required'),
          403: errorResponse('ADMIN or OPERATOR role is required'),
        },
      },
    },
    '/api/reports/trips/{tripId}/manifest': {
      get: {
        operationId: 'getTripManifest',
        summary: 'Get passenger manifest and occupancy reconciliation',
        description: 'Requires ADMIN or OPERATOR. Operators can view manifests only for their own trips.',
        tags: ['Reports'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'tripId',
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
          },
        ],
        responses: {
          200: dataResponse('Manifest returned with seat reconciliation', {
            type: 'object',
            properties: {
              trip: { type: 'object', additionalProperties: true },
              occupancy: {
                type: 'object',
                properties: {
                  total_capacity: { type: 'integer' },
                  confirmed_passengers: { type: 'integer' },
                  booked_seats: { type: 'integer' },
                  available_seats: { type: 'integer' },
                  occupancy_percentage: { type: 'number' },
                  reconciled: { type: 'boolean' },
                },
              },
              passengers: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          }),
          401: errorResponse('Authentication is required'),
          403: errorResponse('The caller cannot view this operator’s manifest'),
          404: errorResponse('Trip not found'),
        },
      },
    },
    '/api/audit': {
      get: {
        operationId: 'getAuditLogs',
        summary: 'List audit trail records',
        description: 'Requires the ADMIN role.',
        tags: ['Audit'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'action', in: 'query', schema: { type: 'string' } },
          { name: 'entity_type', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, minimum: 1 } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 } },
        ],
        responses: {
          200: successResponse('Audit records returned', {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              total: { type: 'integer' },
              data: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          }),
          401: errorResponse('Authentication is required'),
          403: errorResponse('ADMIN role is required'),
        },
      },
    },
  },
};

module.exports = { swaggerDoc };
