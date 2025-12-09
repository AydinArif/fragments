// src/routes/api/data.js
const Fragment = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const { id } = req.params;

    const fragment = await Fragment.byId(ownerId, id);
    const data = await fragment.getData();

    if (!data) return res.status(404).json(createErrorResponse(404, 'No data found'));

    // Return base64-encoded payload and type so frontends can edit/update easily
    res
      .status(200)
      .json({
        status: 'ok',
        fragment: { id: fragment.id, type: fragment.type, data: data.toString('base64') },
      });
  } catch (err) {
    if (err.message === 'Fragment not found') {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    logger.error({ err }, 'Error retrieving fragment data');
    return res.status(500).json(createErrorResponse(500, err.message));
  }
};
