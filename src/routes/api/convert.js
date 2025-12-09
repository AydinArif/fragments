// src/routes/api/convert.js
const Fragment = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

let sharp;
try {
  sharp = require('sharp');
} catch (err) {
  logger.debug({ err }, 'sharp not available for image conversions');
}

module.exports = async (req, res) => {
  try {
    const ownerId = req.user;
    const { id } = req.params;
    const { target } = req.body || {};

    if (!target) {
      return res.status(400).json(createErrorResponse(400, 'Missing target content-type'));
    }

    const fragment = await Fragment.byId(ownerId, id);
    const data = await fragment.getData();

    if (!data) return res.status(404).json(createErrorResponse(404, 'No data found'));

    // Markdown -> HTML
    if (fragment.type === 'text/markdown' && target === 'text/html') {
      const html = md.render(data.toString());
      res.set('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    // JSON -> text/plain
    if (fragment.type === 'application/json' && target === 'text/plain') {
      res.set('Content-Type', 'text/plain');
      return res.status(200).send(Buffer.from(JSON.stringify(JSON.parse(data.toString()))));
    }

    // Image conversions
    if (fragment.mimeType && fragment.mimeType.startsWith('image/')) {
      if (!sharp) {
        return res.status(415).json(createErrorResponse(415, 'Image conversions not available'));
      }

      // Map target content-type to sharp format
      const fmt = target.split('/')[1];
      if (!['png', 'jpeg', 'jpg', 'webp'].includes(fmt)) {
        return res.status(415).json(createErrorResponse(415, 'Unsupported image target'));
      }

      try {
        const input = Buffer.isBuffer(data) ? data : Buffer.from(data);
        const targetFmt = fmt === 'jpg' ? 'jpeg' : fmt;
        const converted = await sharp(input).toFormat(targetFmt).toBuffer();
        res.set('Content-Type', `image/${targetFmt === 'jpeg' ? 'jpeg' : targetFmt}`);
        return res.status(200).send(converted);
      } catch (err) {
        logger.error({ err }, 'Image conversion failed');
        return res.status(500).json(createErrorResponse(500, 'Image conversion failed'));
      }
    }

    // Unsupported conversion
    return res
      .status(415)
      .json(
        createErrorResponse(415, `Conversion from ${fragment.type} to ${target} not supported`)
      );
  } catch (err) {
    if (err.message === 'Fragment not found') {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    logger.error({ err }, 'Error performing conversion');
    return res.status(500).json(createErrorResponse(500, err.message));
  }
};
