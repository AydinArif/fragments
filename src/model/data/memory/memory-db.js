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

    const db = this.db;
    const value = db[primaryKey] && db[primaryKey][secondaryKey];
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

    const db = this.db;
    // Ensure the primary key exists
    db[primaryKey] = db[primaryKey] || {};
    // Store the value under the secondary key
    db[primaryKey][secondaryKey] = value;
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

    const db = this.db;
    const values = db[primaryKey] ? Object.values(db[primaryKey]) : [];
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

    // Throw if the key doesn't exist
    if (!(await this.get(primaryKey, secondaryKey))) {
      throw new Error(
        `missing entry for primaryKey=${primaryKey} and secondaryKey=${secondaryKey}`
      );
    }

    const db = this.db;
    delete db[primaryKey][secondaryKey];
    return Promise.resolve();
  }
}

module.exports = MemoryDB;
