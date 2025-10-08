// tests/unit/memory-db.test.js
const db = require('../../src/model/data/memory/memory-db');

describe('In-Memory DB', () => {
  beforeEach(async () => db.clear());

  test('writes and reads a fragment', async () => {
    await db.writeFragment('user1', { id: '1', type: 'text/plain', size: 10 });
    const frag = await db.readFragment('user1', '1');
    expect(frag.type).toBe('text/plain');
  });

  test('returns null for unknown fragment', async () => {
    const result = await db.readFragment('userX', '999');
    expect(result).toBeNull();
  });

  test('writes and reads fragment data', async () => {
    const buf = Buffer.from('hello');
    await db.writeFragmentData('u', 'a', buf);
    const data = await db.readFragmentData('u', 'a');
    expect(data.toString()).toBe('hello');
  });

  test('lists fragment ids for user', async () => {
    await db.writeFragment('userA', { id: '1' });
    await db.writeFragment('userA', { id: '2' });
    const list = await db.listFragments('userA');
    expect(list).toEqual(expect.arrayContaining(['1', '2']));
  });
});
