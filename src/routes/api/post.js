// src/routes/api/post.js
const express = require('express');
const contentType = require('content-type');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const Fragment = require('../../model/fragment');
const logger = require('../../logger');

// Support sending various Content-Types on the body up to 5M in size
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      const { type } = contentType.parse(req);
      return Fragment.isSupportedType(type);
    },
  });

// POST /v1/fragments
module.exports = [rawBody(), async (req, res) => {
  try {
    if (!Buffer.isBuffer(req.body)) {
      logger.warn('Request body is not a buffer');
      return res.status(415).json(createErrorResponse(415, 'unsupported type'));
    }

    const { type } = contentType.parse(req);
    const ownerId = req.user; // user email or id from auth middleware
    const fragment = new Fragment({ ownerId, type });

    await fragment.setData(req.body);

    const apiUrl = process.env.API_URL || `http://${req.headers.host}`;
    const location = `${apiUrl}/v1/fragments/${fragment.id}`;

    res
      .status(201)
      .set('Location', location)
      .json(createSuccessResponse({ fragment }));
  } catch (err) {
    logger.error({ err }, 'Error creating fragment');
    res.status(500).json(createErrorResponse(500, err.message));
  }
}];
