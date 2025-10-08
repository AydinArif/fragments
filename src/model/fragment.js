// src/model/fragment.js

// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId) throw new Error('ownerId is required');
    if (!type) throw new Error('type is required');
    if (!Fragment.isSupportedType(type)) throw new Error(`unsupported type: ${type}`);
    if (typeof size !== 'number' || size < 0) throw new Error('size must be a non-negative number');

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    this.type = type;
    this.size = size;
    this.created = created || new Date().toISOString();
    this.updated = updated || new Date().toISOString();
  }

  /**
   * Get all fragments (id or full) for the given user
   */
  static async byUser(ownerId, expand = false) {
    const results = await listFragments(ownerId, expand);
    if (!results || results.length === 0) return [];

    if (expand) {
      // Parse each stored JSON string into a Fragment instance
      return results.map((r) => {
        const data = typeof r === 'string' ? JSON.parse(r) : r;
        return new Fragment(data);
      });
    } else {
      return results;
    }
  }

  /**
   * Gets a fragment for the user by the given id.
   */
  static async byId(ownerId, id) {
    const data = await readFragment(ownerId, id);
    if (!data) throw new Error('Fragment not found');
    return new Fragment(data);
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   */
  static async delete(ownerId, id) {
    await deleteFragment(ownerId, id);
  }

  /**
   * Saves the current fragment (metadata) to the database
   */
  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   */
  async getData() {
    const data = await readFragmentData(this.ownerId, this.id);
    return data;
  }

  /**
   * Set's the fragment's data in the database
   */
  async setData(data) {
    if (!Buffer.isBuffer(data)) {
      throw new Error('Data must be a Buffer');
    }
    this.size = data.length;
    this.updated = new Date().toISOString();
    await writeFragmentData(this.ownerId, this.id, data);
    await this.save();
  }

  /**
   * Returns the mime type (e.g., without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type);
    return type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   */
  get formats() {
    // Currently, only text/plain supported
    if (this.mimeType === 'text/plain') return ['text/plain'];
    return [this.mimeType];
  }

  /**
   * Returns true if we know how to work with this content type
   */
  static isSupportedType(value) {
    if (!value) return false;
    const { type } = contentType.parse(value);
    const supported = ['text/plain'];
    return supported.includes(type);
  }
}

module.exports.Fragment = Fragment;
