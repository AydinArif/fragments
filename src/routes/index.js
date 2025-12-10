// src/routes/index.js

const express = require('express');
const { version, author } = require('../../package.json');
const { authenticate } = require('../auth');
const { createSuccessResponse } = require('../response');
const { hostname } = require('os');

const router = express.Router();

// Health check route
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json(
    createSuccessResponse({
      author,
      githubUrl: 'https://github.com/AydinArif/fragments',
      version,
      hostname: hostname(), // <-- REQUIRED FOR WALKTHROUGH
    })
  );
});

// Parse incoming request bodies as raw bytes for the API routes so
// handlers can access the raw Buffer at `req.body` (required by tests).
// Then apply authentication and mount the API router.
router.use('/v1', express.raw({ type: '*/*', limit: '10mb' }), authenticate(), require('./api'));

module.exports = router;
