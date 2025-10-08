const crypto = require('crypto');

module.exports = (email) => {
  if (!email) throw new Error('email required');
  return crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex');
};
