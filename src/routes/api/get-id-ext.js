// src/routes/api/get-id-ext.js

const Fragment = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  // sharp may not be installed in some environments; conversions will fail later with 415
  logger && logger.debug && logger.debug('sharp not available, image conversions disabled');
}

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

    // Only supporting Markdown -> HTML conversion since A2 requirement
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

    // JSON -> plain text conversion
    if ((ext === 'txt' || ext === 'text') && fragment.type === 'application/json') {
      res.set('Content-Type', 'text/plain');
      return res.status(200).send(Buffer.from(JSON.stringify(JSON.parse(data.toString()))));
    }

    // Image conversions using sharp
    if (fragment.mimeType && fragment.mimeType.startsWith('image/')) {
      if (!sharp) {
        return res
          .status(415)
          .json(
            createErrorResponse(415, 'Image conversions are not available in this environment')
          );
      }

      // supported target image extensions
      const supportedExts = ['png', 'jpg', 'jpeg', 'webp'];
      if (!supportedExts.includes(ext)) {
        return res
          .status(415)
          .json(
            createErrorResponse(415, `Conversion from ${fragment.type} to .${ext} not supported`)
          );
      }

      try {
        const input = Buffer.isBuffer(data) ? data : Buffer.from(data);

        // Normalize jpeg ext
        const target = ext === 'jpg' ? 'jpeg' : ext;

        const converted = await sharp(input).toFormat(target).toBuffer();

        // Set appropriate Content-Type
        const contentType = `image/${target === 'jpeg' ? 'jpeg' : target}`;
        res.set('Content-Type', contentType);
        return res.status(200).send(converted);
      } catch (err) {
        logger.error({ err }, 'Image conversion error');
        return res.status(500).json(createErrorResponse(500, 'Error converting image'));
      }
    }

    // Unsupported conversion
    res
      .status(415)
      .json(createErrorResponse(415, `Conversion from ${fragment.type} to .${ext} not supported`));
  } catch (err) {
    if (err.message === 'Fragment not found') {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    logger.error({ err }, 'Error retrieving converted fragment');
    res.status(500).json(createErrorResponse(500, err.message));
  }
};
