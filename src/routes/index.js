// src/routes/index.js
const express = require('express');
const router = express.Router();
const fragments = require('./fragments');
const users = require('./users');

// Super simple health check endpoint — ALB will instantly love this
// This is the ONE thing that finally kills the "Deprovisioning → Unknown" loop
router.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Root route — you already have this, keep it
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    author: 'Aydin Arif',
    github: 'https://github.com/aydinarif/fragments',
    twitter: null,
  });
});

// Mount your actual API routes
router.use('/fragments', fragments);
router.use('/users', users);

// 404 handler (keep this last)
router.use((req, res) => {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      code: 'not-found',
    },
  });
});

module.exports = router;
