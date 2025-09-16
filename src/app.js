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