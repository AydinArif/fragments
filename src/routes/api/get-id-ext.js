// src/routes/api/get-id-ext.js

const Fragment = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const { id } = req.params;

    // Extract extension (e.g., ".html")
    const ext = req.params.ext.toLowerCase();

    const fragment = await Fragment.byId(ownerId, id);
    const data = await fragment.getData();

    if (!data) {
      return res.status(404).json(createErrorResponse(404, 'No data found'));
    }

    // ✅ Only support Markdown -> HTML conversion for A2
    if (ext === 'html' && fragment.type === 'text/markdown') {
      const html = md.render(data.toString());
      res.set('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    // If same type (e.g., /1234.md)
    if (ext === 'md' && fragment.type === 'text/markdown') {
      res.set('Content-Type', 'text/markdown');
      return res.status(200).send(data);
    }

    // ❌ Unsupported conversion
    res.status(415).json(
      createErrorResponse(
        415,
        `Conversion from ${fragment.type} to .${ext} not supported`
      )
    );
  } catch (err) {
    if (err.message === 'Fragment not found') {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    logger.error({ err }, 'Error retrieving converted fragment');
    res.status(500).json(createErrorResponse(500, err.message));
  }
};
