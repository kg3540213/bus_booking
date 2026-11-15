const originalClientUrl = process.env.CLIENT_URL;
process.env.CLIENT_URL = 'https://bus-booking-taupe-ten.vercel.app/';

const request = require('supertest');
const app = require('../../src/app');

afterAll(() => {
  if (originalClientUrl === undefined) {
    delete process.env.CLIENT_URL;
  } else {
    process.env.CLIENT_URL = originalClientUrl;
  }
});

test('normalizes the configured frontend origin for CORS', async () => {
  const response = await request(app)
    .options('/api/auth/register')
    .set('Origin', 'https://bus-booking-taupe-ten.vercel.app')
    .set('Access-Control-Request-Method', 'POST')
    .set('Access-Control-Request-Headers', 'content-type');

  expect(response.status).toBe(204);
  expect(response.headers['access-control-allow-origin'])
    .toBe('https://bus-booking-taupe-ten.vercel.app');
});
