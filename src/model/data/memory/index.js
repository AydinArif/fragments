// src/model/data/memory/index.js
const { MemoryDB } = require('./memory-db');

const data = new MemoryDB();
const metadata = new MemoryDB();

/**
 * Write a fragment's metadata to memory db.
 * Accepts either (ownerId, fragment) or (fragment) where fragment.ownerId exists.
 */
function writeFragment(arg1, arg2) {
  let ownerId, fragment;

  if (typeof arg1 === 'string') {
    ownerId = arg1;
    fragment = arg2;
  } else {
    fragment = arg1;
    ownerId = fragment?.ownerId;
  }

  if (!ownerId || !fragment || !fragment.id) {
    throw new Error('ownerId and fragment.id are required');
  }

  const serialized = JSON.stringify(fragment);
  return metadata.put(ownerId, fragment.id, serialized);
}

async function readFragment(ownerId, id) {
  const serialized = await metadata.get(ownerId, id);
  return typeof serialized === 'string' ? JSON.parse(serialized) : serialized;
}

function writeFragmentData(ownerId, id, buffer) {
  return data.put(ownerId, id, buffer);
}

function readFragmentData(ownerId, id) {
  return data.get(ownerId, id);
}

async function listFragments(ownerId, expand = false) {
  const fragments = await metadata.query(ownerId);
  if (!fragments) return [];

  // ensure deterministic order by ID
  const parsed = fragments.map((f) =>
    typeof f === 'string' ? JSON.parse(f) : f
  );
  parsed.sort((a, b) => a.id.localeCompare(b.id));

  if (expand) {
    // tests expect serialized JSON strings
    return parsed.map((f) => JSON.stringify(f));
  }

  return parsed.map((f) => f.id);
}

async function deleteFragment(ownerId, id) {
  await metadata.del(ownerId, id);
  await data.del(ownerId, id);
}

module.exports = {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
};
