// tests/unit/get-id-ext.test.js

// ----- MOCK SHARP -----
jest.mock('sharp', () =>
  jest.fn(() => ({
    toFormat: jest.fn().mockReturnThis(),
    toBuffer: jest.fn().mockResolvedValue(Buffer.from('converted-image')),
  }))
);

// ----- IMPORTS -----
const request = require('supertest');
const express = require('express');
const router = require('../../src/routes/api');
const Fragment = require('../../src/model/fragment');

jest.mock('../../src/model/fragment');
jest.mock('../../src/logger', () => ({
  error: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

// ----- APP SETUP -----
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  req.user = 'user123';
  next();
});

app.use('/v1', router);

// ----- TESTS -----
describe('GET /v1/fragments/:id.ext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  //
  // --- ORIGINAL TESTS ---
  //
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

  test('converts image to requested ext using sharp', async () => {
    const fakeFragment = {
      type: 'image/png',
      getData: jest.fn().mockResolvedValue(Buffer.from('pngdata')),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/123.jpg');

    expect(res.statusCode).toBe(200);
    expect(res.type).toMatch(/image\//);
    expect(res.body.toString()).toBe('converted-image');
  });

  //
  // --- NEW TESTS FOR COVERAGE ---
  //

  test('returns plain text unchanged for .txt', async () => {
    const fakeFragment = {
      type: 'text/plain',
      getData: jest.fn().mockResolvedValue('hello world'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/1.txt');

    expect(res.statusCode).toBe(200);
    expect(res.type).toBe('text/plain');
    expect(res.text).toBe('hello world');
  });

  test('converts markdown to plain text', async () => {
    const fakeFragment = {
      type: 'text/markdown',
      getData: jest.fn().mockResolvedValue('# Title'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/55.txt');

    expect(res.statusCode).toBe(200);
    expect(res.type).toBe('text/plain');
    expect(res.text).toBe('# Title');
  });

  test('converts HTML to plain text', async () => {
    const fakeFragment = {
      type: 'text/html',
      getData: jest.fn().mockResolvedValue('<h1>Hello</h1>'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/44.txt');

    expect(res.statusCode).toBe(200);
    expect(res.type).toBe('text/plain');
    expect(res.text).toBe('<h1>Hello</h1>');
  });

  test('returns CSV unchanged', async () => {
    const fakeFragment = {
      type: 'text/csv',
      getData: jest.fn().mockResolvedValue('name,age\nAydin,21'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/file.csv');

    expect(res.statusCode).toBe(200);
    expect(res.type).toBe('text/csv');
  });

  test('converts CSV to JSON', async () => {
    const fakeFragment = {
      type: 'text/csv',
      getData: jest.fn().mockResolvedValue('name,age\nAydin,21'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/9.json');

    expect(res.statusCode).toBe(200);

    const result = JSON.parse(res.text);
    expect(result).toEqual([{ name: 'Aydin', age: '21' }]);
  });

  test('CSV missing rows throws error', async () => {
    const fakeFragment = {
      type: 'text/csv',
      getData: jest.fn().mockResolvedValue('name,age'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/nope.json');

    expect(res.statusCode).toBe(400);
  });

  test('converts JSON to YAML', async () => {
    const fakeFragment = {
      type: 'application/json',
      getData: jest.fn().mockResolvedValue(JSON.stringify({ hello: 'world' })),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/sample.yaml');

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('hello: world');
  });

  test('invalid JSON → YAML returns 400', async () => {
    const fakeFragment = {
      type: 'application/json',
      getData: jest.fn().mockResolvedValue('INVALID'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/bad.yaml');

    expect(res.statusCode).toBe(400);
  });

  test('YAML to .txt returns plain text', async () => {
    const fakeFragment = {
      type: 'application/yaml',
      getData: jest.fn().mockResolvedValue('name: Aydin'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/ymlfile.txt');

    expect(res.statusCode).toBe(200);
    expect(res.type).toBe('text/plain');
  });

  test('no extension returns original content', async () => {
    const fakeFragment = {
      type: 'text/plain',
      getData: jest.fn().mockResolvedValue('hello'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/justid');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('hello');
  });

  test('unsupported image extension returns 415', async () => {
    const fakeFragment = {
      type: 'image/png',
      getData: jest.fn().mockResolvedValue(Buffer.from('aaa')),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/123.bmp');

    expect(res.statusCode).toBe(415);
  });

  //
  // --- SHARP FAILURE TEST ---
  //
  describe('sharp error handling', () => {
    test('sharp toBuffer rejects → 415', async () => {
      // Override the existing mock created at the top
      const sharp = require('sharp');
      sharp.mockImplementation(() => ({
        toFormat: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockRejectedValue(new Error('sharp fail')),
      }));

      const fakeFragment = {
        type: 'image/png',
        getData: jest.fn().mockResolvedValue(Buffer.from('img')),
      };
      Fragment.byId.mockResolvedValue(fakeFragment);

      const res = await request(app).get('/v1/fragments/5.webp');

      expect(res.statusCode).toBe(415);
      expect(res.body.status).toBe('error');
    });
  });

  test('combined id.ext is parsed correctly', async () => {
    const fakeFragment = {
      type: 'text/plain',
      getData: jest.fn().mockResolvedValue('test'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    await request(app).get('/v1/fragments/abc123.txt');

    expect(Fragment.byId).toHaveBeenCalledWith('user123', 'abc123');
  });

  test('missing extension still returns content', async () => {
    const fakeFragment = {
      type: 'text/plain',
      getData: jest.fn().mockResolvedValue('no ext'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/qwerty');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('no ext');
  });

  test('HTML → JSON returns 415 (unsupported)', async () => {
    const fakeFragment = {
      type: 'text/html',
      getData: jest.fn().mockResolvedValue('<p>x</p>'),
    };
    Fragment.byId.mockResolvedValue(fakeFragment);

    const res = await request(app).get('/v1/fragments/doc.json');

    expect(res.status).toBe(415);
  });
});
