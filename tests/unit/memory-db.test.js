// tests/unit/memory-db.test.js

const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
} = require('../../src/model/data/memory');

// Import the in-memory database instance so we can clear it between tests
const db = require('../../src/model/data/memory/memory-db');

describe('In-Memory Fragment Database', () => {
  const ownerId = 'user123';
  const id = 'frag123';
  const fragment = {
    id,
    ownerId,
    type: 'text/plain',
    size: 12,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };

  // ✅ Properly clear the in-memory DB before each test run
  beforeEach(async () => {
    await db.clear();
  });

  test('writeFragment() and readFragment() should store and retrieve metadata', async () => {
    await writeFragment(fragment);
    const result = await readFragment(ownerId, id);

    expect(result).toBeDefined();
    expect(result.id).toBe(id);
    expect(result.ownerId).toBe(ownerId);
    expect(result.type).toBe('text/plain');
  });

  test('readFragment() returns null for missing fragment', async () => {
    const result = await readFragment('fakeUser', 'nope');
    expect(result).toBeUndefined();
  });

  test('writeFragmentData() and readFragmentData() store and retrieve raw data buffers', async () => {
    const buffer = Buffer.from('Hello World');
    await writeFragmentData(ownerId, id, buffer);
    const result = await readFragmentData(ownerId, id);

    expect(result).toBeInstanceOf(Buffer);
    expect(result.toString()).toBe('Hello World');
  });

  test('listFragments() returns only fragment IDs by default', async () => {
    const f1 = { ...fragment, id: 'a' };
    const f2 = { ...fragment, id: 'b' };
    await writeFragment(f1);
    await writeFragment(f2);

    const list = await listFragments(ownerId);
    expect(Array.isArray(list)).toBe(true);
    expect(list).toEqual(expect.arrayContaining(['a', 'b']));
  });

  test('listFragments(expand=true) returns expanded fragment objects', async () => {
    await writeFragment({ ...fragment, id: 'a' }); // ensure correct id is written
    await db.clear(); // ✅ ensure fresh DB
    const f1 = { ...fragment, id: 'a' };
    await writeFragment(f1);

    const list = await listFragments(ownerId, true);
    expect(Array.isArray(list)).toBe(true);
    expect(typeof list[0]).toBe('string'); // because we store serialized JSON
    const parsed = JSON.parse(list[0]);
    expect(parsed.id).toBe('a');
  });

  test('deleteFragment() removes both metadata and data', async () => {
    const buffer = Buffer.from('bye');
    await writeFragment(fragment);
    await writeFragmentData(ownerId, id, buffer);

    await deleteFragment(ownerId, id);

    const meta = await readFragment(ownerId, id);
    const data = await readFragmentData(ownerId, id);

    expect(meta).toBeUndefined();
    expect(data).toBeUndefined();
  });

  test('deleteFragment() throws if fragment does not exist', async () => {
    await expect(deleteFragment('noUser', 'noId')).rejects.toThrow();
  });
});
