// src/model/data/memory/memory-db.js

/**
 * A simple in-memory key-value store with primary/secondary keys.
 * Each primary key maps to an object of secondary keys → values.
 */

const validateKey = (key) => typeof key === 'string';

class MemoryDB {
  constructor() {
    /** @type {Record<string, any>} */
    this.db = {};
  }

  /**
   * Gets a value for the given primaryKey and secondaryKey
   * @param {string} primaryKey
   * @param {string} secondaryKey
   * @returns {Promise<any>}
   */
  get(primaryKey, secondaryKey) {
    if (!(validateKey(primaryKey) && validateKey(secondaryKey))) {
      throw new Error(
        `primaryKey and secondaryKey strings are required, got primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`
      );
    }

    const value = this.db[primaryKey]?.[secondaryKey];
    return Promise.resolve(value);
  }

  /**
   * Puts a value into the given primaryKey and secondaryKey
   * @param {string} primaryKey
   * @param {string} secondaryKey
   * @param {any} value
   * @returns {Promise<void>}
   */
  put(primaryKey, secondaryKey, value) {
    if (!(validateKey(primaryKey) && validateKey(secondaryKey))) {
      throw new Error(
        `primaryKey and secondaryKey strings are required, got primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`
      );
    }

    if (!this.db[primaryKey]) this.db[primaryKey] = {};
    this.db[primaryKey][secondaryKey] = value;

    return Promise.resolve();
  }

  /**
   * Queries the list of values for the given primaryKey.
   * Always returns an array (even if empty).
   * @param {string} primaryKey
   * @returns {Promise<any[]>}
   */
  query(primaryKey) {
    if (!validateKey(primaryKey)) {
      throw new Error(`primaryKey string is required, got primaryKey=${primaryKey}`);
    }

    const values = this.db[primaryKey] ? Object.values(this.db[primaryKey]) : [];
    return Promise.resolve(values);
  }

  /**
   * Deletes the value with the given primaryKey and secondaryKey.
   * @param {string} primaryKey
   * @param {string} secondaryKey
   * @returns {Promise<void>}
   */
  async del(primaryKey, secondaryKey) {
    if (!(validateKey(primaryKey) && validateKey(secondaryKey))) {
      throw new Error(
        `primaryKey and secondaryKey strings are required, got primaryKey=${primaryKey}, secondaryKey=${secondaryKey}`
      );
    }

    const exists = await this.get(primaryKey, secondaryKey);
    if (!exists) {
      throw new Error(
        `missing entry for primaryKey=${primaryKey} and secondaryKey=${secondaryKey}`
      );
    }

    delete this.db[primaryKey][secondaryKey];
    return Promise.resolve();
  }

  /**
   * Clears the entire in-memory database (used for testing)
   */
  clear() {
    this.db = {};
    return Promise.resolve();
  }
}

// ✅ Export both the class and a shared instance
module.exports = {
  MemoryDB,
  memoryDB: new MemoryDB(),
};
