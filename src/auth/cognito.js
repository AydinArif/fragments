// src/auth/cognito.js
const BearerStrategy = require('passport-http-bearer').Strategy;
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const logger = require('../logger');
const authorize = require('./auth-middleware');

// Verify environment variables
if (!(process.env.AWS_COGNITO_POOL_ID && process.env.AWS_COGNITO_CLIENT_ID)) {
  throw new Error('missing expected env vars: AWS_COGNITO_POOL_ID, AWS_COGNITO_CLIENT_ID');
}

logger.info('Using AWS Cognito for auth');

// Configure verifier for ID tokens
const jwtVerifier = CognitoJwtVerifier.create({
  userPoolId: process.env.AWS_COGNITO_POOL_ID,
  clientId: process.env.AWS_COGNITO_CLIENT_ID,
  tokenUse: 'id', // use ID token, not access token
});

// Preload Cognito public keys
jwtVerifier
  .hydrate()
  .then(() => logger.info('Cognito JWKS cached'))
  .catch((err) => logger.error({ err }, 'Unable to cache Cognito JWKS'));

// Passport Bearer strategy
module.exports.strategy = () =>
  new BearerStrategy(async (token, done) => {
    // If the token is missing or explicitly "undefined" (string), reject
    if (!token || token === 'undefined') {
      return done(null, false);
    }

    try {
      const user = await jwtVerifier.verify(token);
      logger.debug({ user }, 'verified user token');

      done(null, user.sub);
    } catch (err) {
      logger.error({ err, token }, 'could not verify token');
      done(null, false);
    }
  });

// Middleware
module.exports.authenticate = () => authorize('bearer');
