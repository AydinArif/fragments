// src/auth/basic-auth.js
const logger = require('../logger');          
const auth = require('http-auth');
// eslint-disable-next-line no-unused-vars
const passport = require('passport');
const authPassport = require('http-auth-passport');
const authorize = require('./auth-middleware');  

if (!process.env.HTPASSWD_FILE) {
  throw new Error('missing expected env var: HTPASSWD_FILE');
}

// Log that we're using Basic Auth
logger.info('Using HTTP Basic Auth for auth');

module.exports.strategy = () =>
  authPassport(
    auth.basic({
      file: process.env.HTPASSWD_FILE,
    })
  );

// ✅ Use authorize wrapper instead of passport.authenticate()
module.exports.authenticate = () => authorize('http');
