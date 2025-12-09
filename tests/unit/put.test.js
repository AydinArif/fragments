// tests/unit/put.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/model/data/memory/memory-db');

describe('PUT /v1/fragments/:id', () => {
  beforeEach(async () => db.clear());

  test('authenticated user can update an existing text fragment', async () => {
    // Create a fragment first
    const createRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Original');

    const fragmentId = createRes.body.fragment.id;

    const res = await request(app)
      .put(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Updated');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.id).toBe(fragmentId);
  });

  test('returns 404 when updating a missing fragment', async () => {
    await request(app)
      .put('/v1/fragments/nope')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('x')
      .expect(404);
  });
});
