// src/auth/auth-middleware.js
const passport = require('passport');
const { createErrorResponse } = require('../response');
const logger = require('../logger');

/**
 * @param {'bearer' | 'http'} strategyName - the passport strategy to use
 * @returns {Function} - the middleware function to use for authentication
 */
module.exports = (strategyName) => {
  return function (req, res, next) {
    /**
     * Define a custom callback to run after the user has been authenticated
     * where we can modify error handling and attach the user to the request.
     * @param {Error} err - an error object
     * @param {string} userId - an authenticated user's unique identifier
     */
    function callback(err, userId) {
      if (err) {
        logger.warn({ err }, 'Error authenticating user');
        return next(createErrorResponse(500, 'Unable to authenticate user'));
      }

      if (!userId) {
        return res.status(401).json(createErrorResponse(401, 'Unauthorized'));
      }

      // ✅ Just attach the raw user ID (email or Cognito sub)
      req.user = userId;
      logger.debug({ userId }, 'Authenticated user');

      next();
    }

    passport.authenticate(strategyName, { session: false }, callback)(req, res, next);
  };
};
