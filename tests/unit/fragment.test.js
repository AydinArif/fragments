// tests/unit/fragment.test.js

const Fragment = require('../../src/model/fragment');
const db = require('../../src/model/data/memory/memory-db');

describe('Fragment class', () => {
  beforeEach(async () => db.clear());

  test('creates and saves a fragment', async () => {
    const f = new Fragment({ ownerId: 'user1', type: 'text/plain' });
    await f.save();
    const saved = await Fragment.byId('user1', f.id);
    expect(saved.id).toBe(f.id);
  });

  test('lists fragments by user', async () => {
    const f1 = new Fragment({ ownerId: 'u', type: 'text/plain' });
    const f2 = new Fragment({ ownerId: 'u', type: 'text/plain' });
    await f1.save();
    await f2.save();
    const list = await Fragment.byUser('u');
    expect(list.length).toBe(2);
  });

  test('sets and gets data correctly', async () => {
    const f = new Fragment({ ownerId: 'user', type: 'text/plain' });
    await f.save();
    const buf = Buffer.from('hello world');
    await f.setData(buf);
    const data = await f.getData();
    expect(data.toString()).toBe('hello world');
  });

  test('only supports text/plain', () => {
    expect(Fragment.isSupportedType('text/plain')).toBe(true);
    expect(Fragment.isSupportedType('image/png')).toBe(false);
  });
});
