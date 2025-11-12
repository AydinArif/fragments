// tests/unit/get-id.test.js
const request = require('supertest');
const app = require('../../src/app');
const Fragment = require('../../src/model/fragment');
const db = require('../../src/model/data/memory/memory-db');

describe('GET /v1/fragments/:id', () => {
  beforeEach(async () => db.clear());

  const user = ['user1@email.com', 'password1'];

  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/abc').expect(401));

  test('returns 404 for non-existent fragment', async () => {
    await request(app).get('/v1/fragments/doesnotexist').auth(...user).expect(404);
  });

  test('authenticated user can retrieve existing fragment', async () => {
    const f = new Fragment({ ownerId: user[0], type: 'text/plain' });
    await f.save();
    await f.setData(Buffer.from('Hello Aydin!'));

    const res = await request(app).get(`/v1/fragments/${f.id}`).auth(...user);
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Hello Aydin!');
    expect(res.headers['content-type']).toMatch(/text\/plain/);
  });

  test('returns markdown content as-is when no conversion requested', async () => {
    const f = new Fragment({ ownerId: user[0], type: 'text/markdown' });
    await f.save();
    await f.setData(Buffer.from('# Hello Markdown'));

    const res = await request(app).get(`/v1/fragments/${f.id}`).auth(...user);
    expect(res.statusCode).toBe(200);
    expect(res.text.trim()).toBe('# Hello Markdown');
    expect(res.headers['content-type']).toMatch(/text\/markdown/);
  });

  test('converts markdown to HTML when requested via .html', async () => {
    const f = new Fragment({ ownerId: user[0], type: 'text/markdown' });
    await f.save();
    await f.setData(Buffer.from('# Hello HTML'));

    const res = await request(app).get(`/v1/fragments/${f.id}.html`).auth(...user);
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<h1>Hello HTML</h1>');
  });

  test('converts markdown to HTML when Accept: text/html header is used', async () => {
    const f = new Fragment({ ownerId: user[0], type: 'text/markdown' });
    await f.save();
    await f.setData(Buffer.from('# Header'));

    const res = await request(app)
      .get(`/v1/fragments/${f.id}`)
      .set('Accept', 'text/html')
      .auth(...user);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<h1>Header</h1>');
  });

  test('handles unexpected internal errors gracefully', async () => {
    const spy = jest.spyOn(Fragment, 'byId').mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    const res = await request(app).get('/v1/fragments/bad').auth(...user);
    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe('Unexpected error');

    spy.mockRestore();
  });

  test('returns 404 if fragment data is missing', async () => {
    const f = new Fragment({ ownerId: user[0], type: 'text/plain' });
    await f.save();

    const res = await request(app).get(`/v1/fragments/${f.id}`).auth(...user);
    expect(res.statusCode).toBe(404);
    expect(res.body.error.message).toBe('No data found');
  });
});
