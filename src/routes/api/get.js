// src/routes/api/get.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const Fragment = require('../../model/fragment');
const logger = require('../../logger');

/**
 * GET /v1/fragments
 * Returns a list of fragments for the authenticated user.
 */
module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    logger.debug({ ownerId }, 'Fetching fragments for user');

    const fragments = await Fragment.byUser(ownerId);

    res.status(200).json(
      createSuccessResponse({
        fragments,
      })
    );
  } catch (err) {
    logger.error({ err }, 'Error listing fragments');
    res.status(500).json(createErrorResponse(500, err.message));
  }
};
