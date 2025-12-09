// tests/unit/delete.test.js
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/model/data/memory/memory-db');

describe('DELETE /v1/fragments/:id', () => {
  beforeEach(async () => db.clear());

  test('authenticated user can delete an existing fragment', async () => {
    const createRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('To be deleted');

    const fragmentId = createRes.body.fragment.id;

    const res = await request(app)
      .delete(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('deleting non-existent fragment returns 404', async () => {
    await request(app)
      .delete('/v1/fragments/missing')
      .auth('user1@email.com', 'password1')
      .expect(404);
  });
});
