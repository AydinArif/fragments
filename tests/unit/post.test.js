// tests/unit/post.test.js

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/model/data/memory/memory-db');

describe('POST /v1/fragments', () => {
  beforeEach(async () => db.clear());

  test('unauthenticated users cannot create fragments', async () => {
    await request(app).post('/v1/fragments').send('hello').expect(401);
  });

  test('authenticated user can create a text/plain fragment', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Hello world');

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/plain');
    expect(res.headers.location).toMatch(/\/v1\/fragments\//);
  });

  test('authenticated user can create an application/json fragment', async () => {
    const jsonData = { hi: 'there' };
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(jsonData));

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('application/json');
    expect(res.headers.location).toMatch(/\/v1\/fragments\//);
  });

  test('authenticated user can create an image/png fragment', async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]); // minimal PNG magic
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(png);

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('image/png');
    expect(res.headers.location).toMatch(/\/v1\/fragments\//);
  });

  test('rejects truly unsupported content types', async () => {
    await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/octet-stream')
      .send('somebinarydata')
      .expect(415);
  });
});
