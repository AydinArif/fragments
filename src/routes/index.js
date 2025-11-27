const express = require('express');
const router = express.Router();
const fragments = require('./api'); // FIXED

// Health check
router.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    author: 'Aydin Arif',
    github: 'https://github.com/aydinarif/fragments',
    twitter: null,
  });
});

// Mount actual API routes
router.use('/fragments', fragments);

// 404 handler
router.use((req, res) => {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      code: 'not-found',
    },
  });
});

module.exports = router;
