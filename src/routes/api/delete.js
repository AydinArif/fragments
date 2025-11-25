// src/routes/api/delete.js

const Fragment = require('../../model/fragment');
const { createErrorResponse, createSuccessResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  const ownerId = req.user;
  const { id } = req.params;

  try {
    // ✔ 1. Ensure fragment exists BEFORE trying to delete it
    //    (prevents false 404 from metadata.del())
    await Fragment.byId(ownerId, id);

    // ✔ 2. Perform deletion (metadata + S3)
    await Fragment.delete(ownerId, id);

    // ✔ 3. Return success
    return res
      .status(200)
      .json(createSuccessResponse({ message: 'Fragment deleted' }));

  } catch (err) {
    logger.warn({ ownerId, id, err }, 'Delete fragment failed');
    return res
      .status(404)
      .json(createErrorResponse(404, 'Fragment not found'));
  }
};
