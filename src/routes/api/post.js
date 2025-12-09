// src/routes/api/post.js
const express = require('express');
const contentType = require('content-type');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const Fragment = require('../../model/fragment');
const logger = require('../../logger');

// Middleware to handle both text/* and JSON
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '10mb',
    type: (req) => {
      try {
        const { type } = contentType.parse(req);
        return type.startsWith('text/') || type === 'application/json' || type.startsWith('image/');
      } catch {
        return false;
      }
    },
  });

// POST /v1/fragments
module.exports = [
  rawBody(),
  async (req, res) => {
    try {
      const { type } = contentType.parse(req);
      const ownerId = req.user;

      // Check supported types (allow images too)
      if (!type.startsWith('text/') && type !== 'application/json' && !type.startsWith('image/')) {
        logger.warn(`Unsupported Content-Type received: ${type}`);
        return res
          .status(415)
          .json(
            createErrorResponse(
              415,
              'Unsupported Media Type: only text/* or application/json allowed'
            )
          );
      }

      // Empty body check
      if (!req.body || req.body.length === 0) {
        logger.warn('Empty request body received');
        return res.status(400).json(createErrorResponse(400, 'Empty request body'));
      }

      // Create fragment
      const fragment = new Fragment({ ownerId, type });

      let dataToStore;

      if (type === 'application/json') {
        try {
          // Convert Buffer → string → validate → store as Buffer
          const jsonString = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : req.body;

          JSON.parse(jsonString); // validation only
          dataToStore = Buffer.from(jsonString, 'utf8');
        } catch (err) {
          logger.error({ err }, 'Invalid JSON format');
          return res.status(400).json(createErrorResponse(400, 'Invalid JSON body'));
        }
      } else if (type.startsWith('image/')) {
        // Image types: store raw bytes
        dataToStore = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body);
      } else {
        // Text/plain or text/* types
        dataToStore = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body, 'utf8');
      }

      await fragment.setData(dataToStore);
      await fragment.save();

      const apiUrl = process.env.API_URL || `http://${req.headers.host}`;
      const location = `${apiUrl}/v1/fragments/${fragment.id}`;

      logger.info(`Fragment created successfully (type: ${type})`);

      return res.status(201).set('Location', location).json(createSuccessResponse({ fragment }));
    } catch (err) {
      logger.error({ err }, 'Server error while creating fragment');
      return res.status(500).json(createErrorResponse(500, err.message || 'Internal Server Error'));
    }
  },
];
