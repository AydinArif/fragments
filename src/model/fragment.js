// src/model/fragment.js
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

class Fragment {
  constructor({ id, ownerId, type, size = 0, created, updated }) {
    if (!ownerId) throw new Error('ownerId is required');
    if (!type) throw new Error('type is required');
    if (typeof size !== 'number' || size < 0)
      throw new Error('size must be a non-negative number');
    if (!Fragment.isSupportedType(type))
      throw new Error(`unsupported type: ${type}`);

    this.id = id || uuidv4();
    this.ownerId = ownerId;
    this.type = type;
    this.size = size;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
  }

  static SUPPORTED_TYPES = [
    'text/plain',
    'text/plain; charset=utf-8',
    'text/markdown',
    'text/html',
    'text/csv',
    'application/json',
  ];

  static isSupportedType(type) {
    const baseType = type.toLowerCase().split(';')[0].trim();
    return (
      this.SUPPORTED_TYPES.some((supported) =>
        baseType.startsWith(supported.split(';')[0])
      ) || baseType === 'application/json'
    );
  }

  get mimeType() {
    return this.type.split(';')[0];
  }

  get isText() {
    return (
      this.mimeType.startsWith('text/') ||
      this.mimeType === 'application/json'
    );
  }

  get formats() {
    if (this.type === 'text/plain' || this.type === 'text/plain; charset=utf-8') {
      return ['text/plain'];
    }
    if (this.mimeType === 'application/json') {
      return ['application/json', 'text/plain'];
    }
    if (this.isText) {
      return ['text/plain', 'text/markdown', 'text/html', 'application/json'];
    }
    return [this.type];
  }

  async save() {
    const ownerHash = hash(this.ownerId);
    this.updated = new Date().toISOString();
    await writeFragment(ownerHash, this);
  }

  async setData(data) {
    if (!Buffer.isBuffer(data)) throw new Error('Data must be a Buffer');
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

  static async delete(ownerId, id) {
    const ownerHash = hash(ownerId);
    await deleteFragment(ownerHash, id);
  }

  static async byUser(ownerId, expand = false) {
    const ownerHash = hash(ownerId);
    const list = await listFragments(ownerHash, expand);
    if (expand) {
      return list.map((json) => new Fragment(JSON.parse(json)));
    }
    return list;
  }

  static async byId(ownerId, id) {
    // If ownerId already looks like a hash, don't hash again
    const isHashed = /^[a-f0-9]{64}$/.test(ownerId);
    const ownerKey = isHashed ? ownerId : hash(ownerId);

    const data = await readFragment(ownerKey, id);
    if (!data) throw new Error('Fragment not found');
    return new Fragment(data);
  }
}

module.exports = Fragment;
module.exports.Fragment = Fragment;
