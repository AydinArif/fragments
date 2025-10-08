// tests/unit/get-id.test.js
const request = require('supertest');
const app = require('../../src/app');
const Fragment = require('../../src/model/fragment');
const db = require('../../src/model/data/memory/memory-db');

describe('GET /v1/fragments/:id', () => {
  beforeEach(async () => db.clear());

  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/abc').expect(401));

  test('returns 404 for non-existent fragment', async () => {
    await request(app)
      .get('/v1/fragments/doesnotexist')
      .auth('user1@email.com', 'password1')
      .expect(404);
  });

  test('authenticated user can retrieve existing fragment', async () => {
    const f = new Fragment({ ownerId: 'user1@email.com', type: 'text/plain' });
    await f.save();
    await f.setData(Buffer.from('Hello Aydin!'));

    const res = await request(app)
      .get(`/v1/fragments/${f.id}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Hello Aydin!');
    expect(res.headers['content-type']).toMatch(/text\/plain/);
  });
});
