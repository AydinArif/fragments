// src/routes/api/formats.js
const Fragment = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const { id } = req.params;

    const fragment = await Fragment.byId(ownerId, id);

    // Return list of acceptable target content-types for conversion
    const formats = fragment.formats || [fragment.type];

    res.status(200).json({ status: 'ok', formats });
  } catch (err) {
    if (err.message === 'Fragment not found') {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    logger.error({ err }, 'Error retrieving fragment formats');
    return res.status(500).json(createErrorResponse(500, err.message));
  }
};
