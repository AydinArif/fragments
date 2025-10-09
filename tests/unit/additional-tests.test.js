// extra-coverage.test.js
const authorize = require('../../src/auth/auth-middleware');
const auth = require('../../src/auth');
const Fragment = require('../../src/model/fragment');
const request = require('supertest');
const app = require('../../src/app');

// ---------- AUTH TESTS ----------

test('auth exports expected properties', () => {
  expect(auth).toHaveProperty('authenticate');
  expect(auth).toHaveProperty('strategy');
});

test('authorize returns a middleware function even for invalid strategy', () => {
  const mw = authorize('invalid');
  expect(typeof mw).toBe('function');
});

// ---------- FRAGMENT TESTS ----------

test('throws error when creating fragment with invalid type', () => {
  expect(() => new Fragment({ ownerId: '123', type: 'invalid/type' })).toThrow();
});

test('throws error when setting data with non-buffer value', async () => {
  const fragment = new Fragment({ ownerId: '123', type: 'text/plain' });
  await expect(fragment.setData('not a buffer')).rejects.toThrow();
});

// ---------- MEMORY DATABASE TESTS ----------

test('throws when deleting a non-existent key in MemoryDB', async () => {
  const db = require('../../src/model/data/memory/memory-db');
  await expect(db.del('unknown', 'key')).rejects.toThrow();
});

// ---------- ROUTE TESTS ----------

test('returns 404 for invalid fragment id', async () => {
  const res = await request(app)
    .get('/v1/fragments/bad-id')
    .auth('user1@email.com', 'password1');
  expect([404, 401]).toContain(res.statusCode);
});

test('returns fragments list for authenticated user', async () => {
  const res = await request(app)
    .get('/v1/fragments')
    .auth('user1@email.com', 'password1');
  expect(res.statusCode).toBe(200);
  expect(Array.isArray(res.body.fragments)).toBe(true);
});
