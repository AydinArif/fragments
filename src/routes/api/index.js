const express = require('express');
const router = express.Router();

router.get('/fragments', require('./get'));
router.get('/fragments/:id/info', require('./get-id-info'));
router.get('/fragments/:id.:ext', require('./get-id-ext'));
router.get('/fragments/:id', require('./get-id'));

router.post('/fragments', require('./post'));

// Added this
router.delete('/fragments/:id', require('./delete'));

module.exports = router;
