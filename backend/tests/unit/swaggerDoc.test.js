const request = require('supertest');
const app = require('../../src/app');
const { swaggerDoc } = require('../../src/docs/swaggerDoc');

describe('OpenAPI documentation', () => {
  const documentedOperations = {
    '/api/health': ['get'],
    '/api/auth/register': ['post'],
    '/api/auth/login': ['post'],
    '/api/auth/demo-login': ['post'],
    '/api/auth/me': ['get'],
    '/api/operators': ['get', 'post'],
    '/api/operators/{id}': ['get', 'put'],
    '/api/buses': ['get', 'post'],
    '/api/buses/{id}': ['get'],
    '/api/routes/cities': ['get'],
    '/api/routes': ['get', 'post'],
    '/api/routes/{id}': ['get'],
    '/api/trips/search': ['get'],
    '/api/trips/{id}': ['get'],
    '/api/trips': ['post'],
    '/api/trips/{id}/status': ['patch'],
    '/api/bookings': ['post'],
    '/api/bookings/pnr/{pnr}': ['get'],
    '/api/bookings/my-bookings': ['get'],
    '/api/bookings/{id}/cancellation-quote': ['get'],
    '/api/bookings/{id}/cancel': ['post'],
    '/api/reports/dashboard': ['get'],
    '/api/reports/occupancy': ['get'],
    '/api/reports/trips/{tripId}/manifest': ['get'],
    '/api/audit': ['get'],
  };

  test('documents every API route with an operation id and response definitions', () => {
    expect(Object.keys(swaggerDoc.paths).sort()).toEqual(Object.keys(documentedOperations).sort());

    for (const [path, methods] of Object.entries(documentedOperations)) {
      expect(Object.keys(swaggerDoc.paths[path]).sort()).toEqual(methods.sort());
      for (const method of methods) {
        const operation = swaggerDoc.paths[path][method];
        expect(operation.operationId).toBeTruthy();
        expect(operation.responses).toBeTruthy();
        expect(operation.responses['200'] || operation.responses['201']).toBeTruthy();
      }
    }
  });

  test('serves the same OpenAPI document used by Swagger UI', async () => {
    const response = await request(app).get('/api/docs.json');
    const uiResponse = await request(app).get('/api/docs/');

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.paths).toEqual(swaggerDoc.paths);
    expect(response.body.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
    expect(uiResponse.status).toBe(200);
    expect(uiResponse.text).toContain('swagger-ui');
  });

  test('uses only resolvable local component references', () => {
    function checkRefs(value) {
      if (Array.isArray(value)) {
        value.forEach(checkRefs);
        return;
      }

      if (value && typeof value === 'object') {
        if (value.$ref) {
          expect(value.$ref.startsWith('#/components/')).toBe(true);
          const target = value.$ref.slice(2).split('/').reduce((current, key) => current && current[key], swaggerDoc);
          expect(target).toBeDefined();
        }
        Object.values(value).forEach(checkRefs);
      }
    }

    checkRefs(swaggerDoc);
  });
});
