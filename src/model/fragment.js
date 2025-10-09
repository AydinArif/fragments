const crypto = require('crypto');
const hash = require('../hash');
const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
} = require('./data/memory');
const { v4: uuidv4 } = require('uuid');

/**
 * Fragment class represents a user-created data fragment with metadata and raw data.
 */
class Fragment {
  constructor({ id, ownerId, type, size = 0, created, updated }) {
    if (!ownerId) throw new Error('ownerId is required');
    if (!type) throw new Error('type is required');
    if (typeof size !== 'number' || size < 0)
      throw new Error('size must be a non-negative number');

    // Always store the plain ownerId (email); hash only when calling DB
    this.id = id || uuidv4();
    this.ownerId = ownerId;
    this.type = type;
    this.size = size;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
  }

  // Supported MIME types
  static SUPPORTED_TYPES = [
    'text/plain',
    'text/plain; charset=utf-8',
    'text/markdown',
    'text/html',
    'application/json',
  ];

  static isSupportedType(type) {
    return this.SUPPORTED_TYPES.some((supported) =>
      type.toLowerCase().startsWith(supported.split(';')[0])
    );
  }

  get mimeType() {
    return this.type.split(';')[0];
  }

  get isText() {
    return this.mimeType.startsWith('text/') || this.mimeType === 'application/json';
  }

  get formats() {
    // Only return full list for Markdown or HTML; others stay specific
    if (this.type === 'text/plain' || this.type === 'text/plain; charset=utf-8') {
      return ['text/plain'];
    }
    if (this.isText) {
      return ['text/plain', 'text/markdown', 'text/html', 'application/json'];
    }
    return [this.type];
  }

  async save() {
    const ownerHash = hash(this.ownerId); // ✅ ensure hashed key
    this.updated = new Date().toISOString();
    await writeFragment(ownerHash, this);
  }

  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer');
    }
    const ownerHash = hash(this.ownerId);
    await writeFragmentData(ownerHash, this.id, data);
    this.size = data.length;
    this.updated = new Date().toISOString();
    await this.save();
  }

  async getData() {
    const ownerHash = hash(this.ownerId);
    return await readFragmentData(ownerHash, this.id);
  }

  async delete() {
    const ownerHash = hash(this.ownerId);
    await deleteFragment(ownerHash, this.id);
  }

  static async byUser(ownerId, expand = false) {
    const ownerHash = hash(ownerId);
    return await listFragments(ownerHash, expand);
  }

  static async byId(ownerId, id) {
    const ownerHash = hash(ownerId);
    const data = await readFragment(ownerHash, id);
    if (!data) return null;
    return new Fragment(data);
  }
}

module.exports = Fragment;
module.exports.Fragment = Fragment;
