// src/server.js
require('dotenv').config();

const stoppable = require('stoppable');
const logger = require('./logger');
const app = require('./app');

// CRITICAL FIX: Respect the PORT environment variable set by ECS/Fargate
// Never default to 8080 if PORT is provided (even if it's "0" or empty string)
const port = process.env.PORT ? Number(process.env.PORT) : 8080;

if (!port || isNaN(port)) {
  logger.error({ PORT: process.env.PORT }, 'Invalid or missing PORT environment variable');
  process.exit(1);
}

const server = stoppable(
  app.listen(port, () => {
    logger.info(`Server started on port ${port}`);
  })
);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received: shutting down gracefully');
  server.stop(() => {
    logger.info('Server stopped');
    process.exit(0);
  });
});

module.exports = server;
