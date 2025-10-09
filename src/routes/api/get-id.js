// src/routes/api/get-id.js

const Fragment = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * GET /v1/fragments/:id
 * Returns the fragment’s raw data if it exists and belongs to the authenticated user.
 */
module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const { id } = req.params;

    const fragment = await Fragment.byId(ownerId, id);
  if (!fragment) {
      logger.warn({ id }, 'Fragment not found');
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    const data = await fragment.getData();
    if (!data) {
      logger.warn({ id }, 'No data found for fragment');
      return res.status(404).json(createErrorResponse(404, 'No data found'));
    }

    // Set Content-Type and send raw data
    res.set('Content-Type', fragment.type);
    res.status(200).send(data);
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragment');
    res.status(500).json(createErrorResponse(500, err.message));
  }
};
