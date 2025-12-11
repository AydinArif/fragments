// tests/unit/post.test.js

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/model/data/memory/memory-db');
const { Fragment } = require('../../src/model/fragment');

jest.spyOn(Fragment.prototype, 'save');
jest.spyOn(Fragment.prototype, 'setData');

describe('POST /v1/fragments', () => {
  beforeEach(() => {
    db.clear();
    jest.clearAllMocks();
  });

  test('unauthenticated users cannot create fragments', async () => {
    await request(app).post('/v1/fragments').send('hello').expect(401);
  });

  // ----------------------
  // CONTENT-TYPE / BODY
  // ----------------------
  test('rejects unsupported content types', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/xml')
      .send('<x></x>');

    expect(res.statusCode).toBe(415);
    expect(res.body.error.message).toMatch(/Unsupported Content-Type/);
  });

  test('accepts empty buffer body', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from(''));

    expect(res.statusCode).toBe(201);
    expect(res.body.fragment.size).toBe(0);
  });

  // ----------------------
  // VALID FRAGMENTS
  // ----------------------
  test('authenticated user can create a text/plain fragment', async () => {
    Fragment.prototype.save.mockResolvedValue();
    Fragment.prototype.setData.mockResolvedValue();

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('Hello world'));

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.type).toBe('text/plain');
  });

  test('authenticated user can create JSON fragment', async () => {
    Fragment.prototype.save.mockResolvedValue();
    Fragment.prototype.setData.mockResolvedValue();

    const data = { hi: 'there' };

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(Buffer.from(JSON.stringify(data)));

    expect(res.statusCode).toBe(201);
    expect(res.body.fragment.type).toBe('application/json');
  });

  test('authenticated user can create PNG fragment', async () => {
    Fragment.prototype.save.mockResolvedValue();
    Fragment.prototype.setData.mockResolvedValue();

    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(png);

    expect(res.statusCode).toBe(201);
    expect(res.body.fragment.type).toBe('image/png');
  });

  // ----------------------
  // LOCATION HEADER
  // ----------------------
  test('uses API_URL env variable if present', async () => {
    Fragment.prototype.save.mockResolvedValue();
    Fragment.prototype.setData.mockResolvedValue();

    process.env.API_URL = 'http://example.com';

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('Hello'));

    expect(res.statusCode).toBe(201);
    expect(res.headers.location.startsWith('http://example.com')).toBe(true);

    delete process.env.API_URL;
  });

  // ----------------------
  // INTERNAL SERVER ERRORS
  // ----------------------
  test('returns 500 if fragment.save() throws error', async () => {
    Fragment.prototype.save.mockRejectedValue(new Error('save fail'));

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('abc'));

    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe('Internal Server Error');
  });

  test('returns 500 if setData throws error', async () => {
    Fragment.prototype.save.mockResolvedValue();
    Fragment.prototype.setData.mockRejectedValue(new Error('write fail'));

    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('abc'));

    expect(res.statusCode).toBe(500);
  });
});
