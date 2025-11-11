// src/routes/api/get-id-info.js
const Fragment = require('../../model/fragment');
const { createErrorResponse, createSuccessResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const { id } = req.params;
    const fragment = await Fragment.byId(ownerId, id);

    res.status(200).json(
      createSuccessResponse({
        fragment: {
          id: fragment.id,
          ownerId: fragment.ownerId,
          type: fragment.type,
          size: fragment.size,
          created: fragment.created,
          updated: fragment.updated,
        },
      })
    );
  } catch (err) {
    logger.error({ err }, 'Error retrieving fragment metadata');
    res.status(404).json(createErrorResponse(404, 'Fragment not found'));
  }
};
