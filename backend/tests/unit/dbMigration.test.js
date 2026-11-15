jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('fs', () => ({ readFileSync: jest.fn(() => 'SELECT 1;') }));
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    on: jest.fn(),
  })),
}));

const { Pool } = require('pg');
const { runMigration } = require('../../src/db/migrate');

describe('Database migration', () => {
  const pool = Pool.mock.results[0].value;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('logs and rethrows a database connection failure', async () => {
    const connectionError = new Error('Database unreachable');
    pool.connect.mockRejectedValueOnce(connectionError);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(runMigration()).rejects.toBe(connectionError);

    expect(errorSpy).toHaveBeenCalledWith('Migration failed:', connectionError);
  });
});
