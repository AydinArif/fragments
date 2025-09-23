// src/routes/api/get.js

const { createSuccessResponse } = require('../../response');

/**
 * Get a list of fragments for the current user
 */
module.exports = (req, res) => {
  // TODO: replace placeholder with real fragments for the authenticated user
  res.status(200).json(
    createSuccessResponse({
      fragments: [],
    })
  );
};
