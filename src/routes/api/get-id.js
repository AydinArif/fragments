// src/routes/api/get-id.js
const Fragment = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
const MarkdownIt = require('markdown-it');

// initialize markdown-it
const md = new MarkdownIt();

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const { id } = req.params;

    const fragment = await Fragment.byId(ownerId, id);
    let data = await fragment.getData();

    if (!data) {
      return res.status(404).json(createErrorResponse(404, 'No data found'));
    }

    const contentType = fragment.type;
    let responseType = contentType;

    // Convert markdown to HTML if requested
    if (
      contentType.startsWith('text/markdown') &&
      (req.url.endsWith('.html') || req.headers.accept?.includes('text/html'))
    ) {
      logger.info('Converting Markdown to HTML');
      data = md.render(data.toString());
      responseType = 'text/html';
    }

    // For text or JSON responses, send strings so browsers can render them
    if (responseType.startsWith('text/') || responseType === 'application/json') {
      if (Buffer.isBuffer(data)) {
        // For JSON, pretty-print for easier viewing
        if (responseType === 'application/json') {
          try {
            const parsed = JSON.parse(data.toString());
            data = JSON.stringify(parsed, null, 2);
          } catch {
            data = data.toString('utf8');
          }
        } else {
          data = data.toString('utf8');
        }
      }
    }

    res.set('Content-Type', responseType);
    res.status(200).send(data);
  } catch (err) {
    if (err.message === 'Fragment not found') {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    logger.error({ err }, 'Error retrieving fragment');
    res.status(500).json(createErrorResponse(500, err.message));
  }
};
