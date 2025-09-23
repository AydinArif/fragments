// src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Create an express app
const app = express();

// Use middleware
app.use(helmet());
app.use(cors());
app.use(compression());
// Define our routes
app.use('/', require('./routes'));

// Export our app
module.exports = app;

// modifications to src/app.js
const passport = require('passport');
const authenticate = require('./auth');

// Set up our passport authentication middleware
passport.use(authenticate.strategy());
app.use(passport.initialize());

// Define our routes
app.use('/', require('./routes'));

// Add 404 middleware to handle any requests for resources that can't be found can't be found
app.use((req, res) => {
  // Pass along an error object to the error-handling middleware
  res.status(404).json({
    status: 'error',
    error: {
      message: 'not found',
      code: 404,
    },
  });
});