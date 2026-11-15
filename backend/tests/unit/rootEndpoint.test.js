const request = require('supertest');
const app = require('../../src/app');

describe('Root and Health Endpoints', () => {
  test('GET / returns 200 with operational status and endpoints map', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.endpoints).toHaveProperty('health', '/api/health');
    expect(res.body.endpoints).toHaveProperty('docs', '/api/docs');
  });

  test('GET /health returns 200 with healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('API');
  });

  test('GET /api/health returns 200 with healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});
