// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');

// Create a router on which to mount our API endpoints
const router = express.Router();

// Define our first route, which will be: GET /v1/fragments
router.get('/fragments', require('./get'));
// Other routes (POST, DELETE, etc.) will go here later on...

// GET /v1/fragments/:id
router.get('/fragments/:id', require('./get-id'));

// POST /v1/fragments
router.post('/fragments', require('./post'));

// GET /v1/fragments/:id/info
router.get('/fragments/:id/info', require('./get-id-info'));

module.exports = router;
