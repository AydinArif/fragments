const express = require('express');
const router = express.Router();

router.get('/fragments', require('./get'));
router.get('/fragments/:id/info', require('./get-id-info'));
router.get('/fragments/:id.:ext', require('./get-id-ext'));
router.get('/fragments/:id', require('./get-id'));

router.post('/fragments', require('./post'));
router.put('/fragments/:id', require('./put'));
router.get('/fragments/:id/data', require('./data'));
router.post('/fragments/:id/convert', require('./convert'));
router.get('/fragments/:id/formats', require('./formats'));

// Added this
router.delete('/fragments/:id', require('./delete'));

module.exports = router;
