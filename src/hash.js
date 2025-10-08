/**
 * For increased data privacy, we store only a hashed version of the user's email.
 * We use a SHA-256 hash of the user's email encoded in hex, which is safe to
 * include in URLs.
 *
 * Example output:
 *   6Xoj0UXOW3FNirlSYranli5gY6dDq60hs24EIAcHAEc=
 *
 * You can use the whole hash, or shorten it by doing `.slice(0, 8)` if needed.
 */

const crypto = require('crypto');

/**
 * Hashes an email into a consistent SHA-256 string.
 * @param {string} email - The user's email address
 * @returns {string} The hashed version of the email in hex
 */
module.exports = (email) => {
  if (!email) {
    throw new Error('Email is required for hashing');
  }
  return crypto.createHash('sha256').update(email).digest('hex');
};
