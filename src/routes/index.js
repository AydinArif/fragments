// src/routes/index.js

const express = require('express');
const { version, author } = require('../../package.json');
const { authenticate } = require('../auth');

const router = express.Router();

// Health check route
router.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json({
    status: 'ok',
    author,
    githubUrl: 'https://github.com/AydinArif/fragments',
    version,
  });
});

// Protect all /v1/* routes with authentication
router.use('/v1', authenticate(), require('./api'));

module.exports = router;
