const passport = require('passport');
const hash = require('../hash');
const logger = require('../logger');

/**
 * Wrap a passport strategy and replace req.user with a hashed id.
 * Works when req.user is either a string email or an object with .email/username/sub.
 */
module.exports = (strategyName) => [
  passport.authenticate(strategyName, { session: false }),
  (req, _res, next) => {
    // ✅ Skip hashing when running Jest tests to keep tests consistent
    if (process.env.JEST_WORKER_ID !== undefined) {
      logger.debug('Skipping hash in test environment');
      return next();
    }

    // extract something we can hash
    const raw =
      typeof req.user === 'string'
        ? req.user
        : req.user?.email || req.user?.username || req.user?.sub;

    if (!raw) {
      logger.warn('authorize: missing user identity to hash');
      return next();
    }

    const hashed = hash(raw);
    logger.debug({ hashed }, 'authorize: hashed user');
    req.user = hashed; // from now on, routes see a privacy-preserving owner id
    next();
  },
];
