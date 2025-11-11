// tests/unit/get-id-ext.test.js

const request = require('supertest');
const express = require('express');
const router = require('../../src/routes/api');
const Fragment = require('../../src/model/fragment');

jest.mock('../../src/model/fragment');
jest.mock('../../src/logger', () => ({
  error: jest.fn(),
}));

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.user = 'user123';
  next();
});

app.use('/v1', router);

describe('GET /v1/fragments/:id.ext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns HTML when converting Markdown (.md → .html)', async () => {
    const fakeFragment = {
      type: 'text/markdown',
      getData: jest.fn().mockResolvedValue('# Hello'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/123.html');

    expect(res.statusCode).toBe(200);
    expect(res.type).toBe('text/html');
    expect(res.text).toContain('<h1>Hello</h1>');
  });

  test('returns Markdown as-is when requesting .md', async () => {
    const fakeFragment = {
      type: 'text/markdown',
      getData: jest.fn().mockResolvedValue('# Hi again'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/abc.md');

    expect(res.statusCode).toBe(200);
    expect(res.type).toBe('text/markdown');
    expect(res.text).toContain('# Hi again');
  });

  test('returns 415 for unsupported conversion type', async () => {
    const fakeFragment = {
      type: 'application/json',
      getData: jest.fn().mockResolvedValue('{}'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/123.html');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });

  test('returns 404 when fragment not found', async () => {
    Fragment.byId.mockRejectedValue(new Error('Fragment not found'));

    const res = await request(app).get('/v1/fragments/missing.html');

    expect(res.statusCode).toBe(404);
  });

  test('returns 500 for unexpected error', async () => {
    Fragment.byId.mockRejectedValue(new Error('DB exploded'));

    const res = await request(app).get('/v1/fragments/err.html');

    expect(res.statusCode).toBe(500);
    expect(res.body.status).toBe('error');
  });
});
