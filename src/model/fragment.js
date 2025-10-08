// src/model/fragment.js

const crypto = require('crypto');
const db = require('./data');
const logger = require('../logger');

class Fragment {
  constructor({ id, ownerId, type, size = 0, created = new Date(), updated = new Date() }) {
    if (!ownerId || !type) throw new Error('ownerId and type are required');
    this.id = id || crypto.randomUUID();
    this.ownerId = ownerId;
    this.type = type;
    this.size = size;
    this.created = created;
    this.updated = updated;
  }

  // --- Data persistence ---
  async save() {
    this.updated = new Date();
    await db.writeFragment(this.ownerId, this);
    logger.debug({ id: this.id, ownerId: this.ownerId }, 'Fragment saved');
    return this;
  }

  static async byId(ownerId, id) {
    const data = await db.readFragment(ownerId, id);
    return data ? new Fragment(data) : null;
  }

  static async byUser(ownerId) {
    const ids = await db.listFragments(ownerId);
    return ids;
  }

  async setData(buffer) {
    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Data must be a Buffer');
    }
    this.size = buffer.length;
    this.updated = new Date();
    await db.writeFragmentData(this.ownerId, this.id, buffer);
    await this.save();
  }

  async getData() {
    const data = await db.readFragmentData(this.ownerId, this.id);
    return data;
  }

  // --- Type validation ---
  static isSupportedType(type) {
    return ['text/plain'].includes(type);
  }
}

module.exports = Fragment;
