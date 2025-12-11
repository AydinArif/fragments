// tests/unit/get.test.js

const request = require('supertest');
const app = require('../../src/app');
const Fragment = require('../../src/model/fragment');

jest.mock('../../src/model/fragment');
jest.mock('../../src/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('GET /v1/fragments', () => {
  //
  // --- AUTH TESTS ---
  //
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments').expect(401));

  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments')
      .auth('invalid@email.com', 'incorrect_password')
      .expect(401));

  //
  // --- BASIC FUNCTIONALITY ---
  //
  test('authenticated users get a fragments array', async () => {
    Fragment.byUser.mockResolvedValue([]);

    const res = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);
  });

  test('authenticated users receive fragments with expected fields', async () => {
    const mockFragments = [
      {
        id: '123',
        ownerId: 'user1',
        type: 'text/plain',
        size: 10,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    ];

    Fragment.byUser.mockResolvedValue(mockFragments);

    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.fragments)).toBe(true);

    const fragment = res.body.fragments[0];
    expect(fragment).toHaveProperty('id');
    expect(fragment).toHaveProperty('ownerId');
    expect(fragment).toHaveProperty('type');
    expect(fragment).toHaveProperty('size');
    expect(fragment).toHaveProperty('created');
    expect(fragment).toHaveProperty('updated');
  });

  //
  // --- NEW COVERAGE TESTS ---
  //

  test('expand=1 calls Fragment.byUser with expand=true', async () => {
    Fragment.byUser.mockResolvedValue([]);

    await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');

    expect(Fragment.byUser).toHaveBeenCalledWith(expect.any(String), true);
  });

  test('expand=true string is treated as boolean true', async () => {
    Fragment.byUser.mockResolvedValue([]);

    await request(app)
      .get('/v1/fragments?expand=true')
      .auth('user1@email.com', 'password1');

    expect(Fragment.byUser).toHaveBeenCalledWith(expect.any(String), true);
  });

  test('expand=0 calls Fragment.byUser with expand=false', async () => {
    Fragment.byUser.mockResolvedValue([]);

    await request(app)
      .get('/v1/fragments?expand=0')
      .auth('user1@email.com', 'password1');

    expect(Fragment.byUser).toHaveBeenCalledWith(expect.any(String), false);
  });

  test('null response from byUser returns empty array', async () => {
    Fragment.byUser.mockResolvedValue(null);

    const res = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.fragments).toEqual([]);
  });

  test('non-array response from byUser returns empty array', async () => {
    Fragment.byUser.mockResolvedValue('not-an-array');

    const res = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.fragments).toEqual([]);
  });

  test('Fragment.byUser throwing an error returns 500', async () => {
    Fragment.byUser.mockRejectedValue(new Error('DB fail'));

    const res = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
  });

  test('expanded fragments return all fields correctly', async () => {
    const mockFragments = [
      {
        id: '789',
        ownerId: 'user1',
        type: 'image/png',
        size: 200,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      },
    ];

    Fragment.byUser.mockResolvedValue(mockFragments);

    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);

    const f = res.body.fragments[0];
    expect(f.id).toBe('789');
    expect(f.type).toBe('image/png');
  });
});
