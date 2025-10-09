// src/routes/api/get-id.js

const Fragment = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const { id } = req.params;

    const fragment = await Fragment.byId(ownerId, id);
    const data = await fragment.getData();

    if (!data) {
      return res.status(404).json(createErrorResponse(404, 'No data found'));
    }

    res.set('Content-Type', fragment.type);
    res.status(200).send(data);
  } catch (err) {
    if (err.message === 'Fragment not found') {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    logger.error({ err }, 'Error retrieving fragment');
    res.status(500).json(createErrorResponse(500, err.message));
  }
};
