// src/model/data/memory/memory-db.js
/**
 * In-Memory database for storing fragments and their raw data.
 * Uses a simple Map keyed by ownerId and fragment id.
 */

const memory = new Map();

/**
 * Write (or update) a fragment’s metadata.
 * @param {string} ownerId
 * @param {object} fragment
 */
async function writeFragment(ownerId, fragment) {
  if (!ownerId || !fragment?.id) {
    throw new Error('ownerId and fragment.id are required');
  }
  const ownerFragments = memory.get(ownerId) || {};
  ownerFragments[fragment.id] = { ...ownerFragments[fragment.id], ...fragment };
  memory.set(ownerId, ownerFragments);
  return ownerFragments[fragment.id];
}

/**
 * Read a fragment’s metadata.
 * @returns {object|null}
 */
async function readFragment(ownerId, id) {
  if (!memory.has(ownerId)) return null;
  const ownerFragments = memory.get(ownerId);
  return ownerFragments[id] || null;
}

/**
 * Write raw data buffer for a fragment.
 */
async function writeFragmentData(ownerId, id, data) {
  const key = `${ownerId}:${id}:data`;
  memory.set(key, data);
  return true;
}

/**
 * Read raw data buffer.
 */
async function readFragmentData(ownerId, id) {
  return memory.get(`${ownerId}:${id}:data`) || null;
}

/**
 * List fragment IDs for an owner.
 */
async function listFragments(ownerId) {
  if (!memory.has(ownerId)) return [];
  return Object.keys(memory.get(ownerId));
}

/**
 * Delete all data (for tests).
 */
async function clear() {
  memory.clear();
}

module.exports = {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  clear,
};
