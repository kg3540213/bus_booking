jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation((options) => ({
    options,
    on: jest.fn(),
  })),
}));

const { Pool } = require('pg');

describe('Database configuration', () => {
  const envKeys = ['DATABASE_URL', 'DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));

  beforeEach(() => {
    jest.resetModules();
    Pool.mockClear();
  });

  afterAll(() => {
    envKeys.forEach((key) => {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    });
  });

  test('uses DATABASE_URL when it is configured', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@example.test:5432/bus_booking';
    process.env.DB_HOST = 'localhost';

    const { pool } = require('../../src/config/db');

    expect(pool.options).toEqual(expect.objectContaining({
      connectionString: process.env.DATABASE_URL,
      max: 20,
    }));
    expect(pool.options).not.toHaveProperty('host');
  });

  test('uses individual DB settings when DATABASE_URL is absent', () => {
    delete process.env.DATABASE_URL;
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5433';
    process.env.DB_USER = 'local_user';
    process.env.DB_PASSWORD = 'local_password';
    process.env.DB_NAME = 'local_database';

    const { pool } = require('../../src/config/db');

    expect(pool.options).toEqual(expect.objectContaining({
      host: 'localhost',
      port: 5433,
      user: 'local_user',
      password: 'local_password',
      database: 'local_database',
    }));
    expect(pool.options).not.toHaveProperty('connectionString');
  });
});
