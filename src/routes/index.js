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
      hostname: hostname(),   // <-- REQUIRED FOR WALKTHROUGH
    })
  );
});

router.use('/v1', authenticate(), require('./api'));

module.exports = router;
