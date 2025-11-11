const request = require('supertest');
const app = require('../../src/app');
const Fragment = require('../../src/model/fragment');
const db = require('../../src/model/data/memory/memory-db');

describe('GET /v1/fragments/:id/info', () => {
  beforeEach(async () => db.clear());

  test('returns metadata for an existing fragment', async () => {
    const f = new Fragment({ ownerId: 'user1@email.com', type: 'text/plain' });
    await f.save();
    await f.setData(Buffer.from('Hello Aydin!'));

    const res = await request(app)
      .get(`/v1/fragments/${f.id}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.fragment.id).toBe(f.id);
    expect(res.body.fragment.type).toBe('text/plain');
  });
});
