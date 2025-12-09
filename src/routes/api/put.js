// src/routes/api/put.js
const express = require('express');
const contentType = require('content-type');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const Fragment = require('../../model/fragment');
const logger = require('../../logger');

// Accept text/*, application/json, and image/* for updates
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '20mb',
    type: (req) => {
      try {
        const { type } = contentType.parse(req);
        return type.startsWith('text/') || type === 'application/json' || type.startsWith('image/');
      } catch {
        return false;
      }
    },
  });

module.exports = [
  rawBody(),
  async (req, res) => {
    try {
      const ownerId = req.user;
      const { id } = req.params;

      const { type } = contentType.parse(req);

      // Check supported types
      if (!Fragment.isSupportedType(type)) {
        logger.warn({ type }, 'Unsupported Content-Type for update');
        return res.status(415).json(createErrorResponse(415, 'Unsupported Media Type'));
      }

      if (!req.body || req.body.length === 0) {
        logger.warn('Empty request body for update');
        return res.status(400).json(createErrorResponse(400, 'Empty request body'));
      }

      // Load the fragment (will throw if not found or not owned)
      const fragment = await Fragment.byId(ownerId, id);

      let dataToStore;
      if (type === 'application/json') {
        try {
          const jsonString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;
          JSON.parse(jsonString);
          dataToStore = Buffer.from(jsonString, 'utf8');
        } catch (err) {
          logger.error({ err }, 'Invalid JSON in update');
          return res.status(400).json(createErrorResponse(400, 'Invalid JSON body'));
        }
      } else {
        dataToStore = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body, 'utf8');
      }

      // Update data and persist metadata
      await fragment.setData(dataToStore);

      logger.info({ id, ownerId }, 'Fragment updated successfully');

      return res.status(200).json(createSuccessResponse({ fragment }));
    } catch (err) {
      if (err.message === 'Fragment not found') {
        return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
      }
      logger.error({ err }, 'Error updating fragment');
      return res.status(500).json(createErrorResponse(500, err.message || 'Internal Server Error'));
    }
  },
];
