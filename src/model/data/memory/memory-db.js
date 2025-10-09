// src/model/data/memory/memory-db.js

/**
 * A simple in-memory key-value store with primary/secondary keys.
 * Each primary key maps to an object of secondary keys → values.
 */

const validateKey = (key) => typeof key === 'string';

class MemoryDB {
  constructor() {
    this.db = {};
  }

  get(primaryKey, secondaryKey) {
    if (!(validateKey(primaryKey) && validateKey(secondaryKey))) {
      throw new Error(`primaryKey and secondaryKey strings are required`);
    }
    const value = this.db[primaryKey]?.[secondaryKey];
    return Promise.resolve(value);
  }

  put(primaryKey, secondaryKey, value) {
    if (!(validateKey(primaryKey) && validateKey(secondaryKey))) {
      throw new Error(`primaryKey and secondaryKey strings are required`);
    }
    if (!this.db[primaryKey]) this.db[primaryKey] = {};
    this.db[primaryKey][secondaryKey] = value;
    return Promise.resolve();
  }

  query(primaryKey) {
    if (!validateKey(primaryKey)) {
      throw new Error(`primaryKey string is required`);
    }
    const values = this.db[primaryKey] ? Object.values(this.db[primaryKey]) : [];
    return Promise.resolve(values);
  }

  async del(primaryKey, secondaryKey) {
    if (!(validateKey(primaryKey) && validateKey(secondaryKey))) {
      throw new Error(`primaryKey and secondaryKey strings are required`);
    }

    const exists = await this.get(primaryKey, secondaryKey);
    if (!exists) {
      throw new Error(`missing entry for primaryKey=${primaryKey} and secondaryKey=${secondaryKey}`);
    }

    delete this.db[primaryKey][secondaryKey];
    return Promise.resolve();
  }

  clear() {
    this.db = {};
    return Promise.resolve();
  }
}

// ✅ Export both:
// - the class for use in `index.js`
// - a shared instance as the default export (so tests can call db.clear())
const sharedInstance = new MemoryDB();

module.exports = sharedInstance;
module.exports.MemoryDB = MemoryDB;
