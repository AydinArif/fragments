// src/routes/api/get.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const Fragment = require('../../model/fragment');
const logger = require('../../logger');

/**
 * GET /v1/fragments
 * Returns a list of fragments for the authenticated user.
 * If `?expand=1` is passed, returns full metadata for each fragment.
 */
module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const expand = req.query.expand === '1';

    logger.debug({ ownerId, expand }, 'Fetching fragments for user');

    const fragments = await Fragment.byUser(ownerId, expand);

    // ✅ Send one clean success response
    res.status(200).json(
      createSuccessResponse({
        fragments: fragments || [],
      })
    );
  } catch (err) {
    logger.error({ err }, 'Error listing fragments');
    res.status(500).json(createErrorResponse(500, err.message));
  }
};
