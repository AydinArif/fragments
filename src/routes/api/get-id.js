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
      (req.url.endsWith('.html') ||
        req.headers.accept?.includes('text/html'))
    ) {
      logger.info('Converting Markdown to HTML');
      data = md.render(data.toString());
      responseType = 'text/html';
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
