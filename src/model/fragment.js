// src/model/fragment.js
const hash = require('../hash');
const logger = require('../logger');
const {
  writeFragment,
  readFragment,
  writeFragmentData,
  readFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');
const { v4: uuidv4 } = require('uuid');

class Fragment {
  constructor({ id, ownerId, type, size = 0, created, updated }) {
    if (!ownerId) throw new Error('ownerId is required');
    if (!type) throw new Error('type is required');
    if (typeof size !== 'number' || size < 0) throw new Error('size must be a non-negative number');
    if (!Fragment.isSupportedType(type)) throw new Error(`unsupported type: ${type}`);

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
    // Basic image types
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
  ];

  static isSupportedType(type) {
    const baseType = type.toLowerCase().split(';')[0].trim();
    return this.SUPPORTED_TYPES.some((supported) => baseType.startsWith(supported.split(';')[0]));
  }

  get mimeType() {
    return this.type.split(';')[0];
  }

  get isText() {
    return this.mimeType.startsWith('text/') || this.mimeType === 'application/json';
  }

  get formats() {
    const baseType = this.mimeType;

    if (baseType === 'text/plain' || this.type === 'text/plain; charset=utf-8') {
      return ['text/plain'];
    }

    if (baseType === 'application/json') {
      return ['application/json', 'text/plain'];
    }

    if (this.isText) {
      return ['text/markdown', 'text/html', 'application/json'];
    }

    // Image formats: allow conversion between common formats
    if (baseType.startsWith('image/')) {
      return ['image/png', 'image/jpeg', 'image/webp'];
    }

    return [this.type];
  }

  // Save metadata to DynamoDB (hashed ownerId)
  async save() {
    const ownerHash = hash(this.ownerId);
    this.updated = new Date().toISOString();
    logger.debug({ ownerId: this.ownerId, ownerHash, id: this.id }, 'Saving fragment');

    const fragmentToStore = {
      id: this.id,
      ownerId: ownerHash,
      type: this.type,
      size: this.size,
      created: this.created,
      updated: this.updated,
    };

    await writeFragment(fragmentToStore);
  }

  // Write data to S3 using hashed ownerId
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
    logger.debug({ ownerId: this.ownerId, ownerHash, id: this.id }, 'Reading fragment data');
    return await readFragmentData(ownerHash, this.id);
  }

  async delete() {
    const ownerHash = hash(this.ownerId);
    logger.debug({ ownerId: this.ownerId, ownerHash, id: this.id }, 'Deleting fragment');
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
      return list.map((item) => {
        const fragmentData = typeof item === 'string' ? JSON.parse(item) : item;
        return new Fragment({ ...fragmentData, ownerId });
      });
    }

    return list;
  }

  static async byId(ownerId, id) {
    const ownerHash = hash(ownerId);
    logger.debug({ ownerId, ownerKey: ownerHash, id }, 'Looking up fragment byId()');

    const data = await readFragment(ownerHash, id);

    if (!data) {
      logger.warn({ ownerId, ownerKey: ownerHash, id }, 'Fragment not found for owner');
      throw new Error('Fragment not found');
    }

    return new Fragment({ ...data, ownerId });
  }
}

module.exports = Fragment;
module.exports.Fragment = Fragment;
