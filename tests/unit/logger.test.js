// tests/unit/logger.test.js
describe('logger.js', () => {
  const path = require('path');
  const loggerPath = path.join(__dirname, '../../src/logger.js');

  afterEach(() => {
    jest.resetModules();
    delete process.env.LOG_LEVEL;
  });

  test('loads logger with default info level', () => {
    const logger = require(loggerPath);
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  test('loads logger with debug level (activates pretty transport)', () => {
    process.env.LOG_LEVEL = 'debug';
    const logger = require(loggerPath);
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe('function');
  });
});
