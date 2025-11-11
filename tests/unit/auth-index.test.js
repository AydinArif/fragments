// tests/unit/auth-index.test.js

describe('src/auth/index.js conditional exports', () => {
  // Helper to clean environment before each case
  const resetEnv = () => {
    jest.resetModules(); // clear require cache
    delete process.env.AWS_COGNITO_POOL_ID;
    delete process.env.AWS_COGNITO_CLIENT_ID;
    delete process.env.HTPASSWD_FILE;
    delete process.env.NODE_ENV;
  };

  beforeEach(() => {
    resetEnv();
  });

  test('throws error if both Cognito and Basic Auth env vars are set', () => {
    process.env.AWS_COGNITO_POOL_ID = 'pool';
    process.env.AWS_COGNITO_CLIENT_ID = 'client';
    process.env.HTPASSWD_FILE = 'tests/.htpasswd';

    expect(() => require('../../src/auth')).toThrow(
      /both AWS Cognito and HTTP Basic Auth/
    );
  });

  test('uses Cognito if AWS_COGNITO_POOL_ID and AWS_COGNITO_CLIENT_ID are set', () => {
    jest.doMock('../../src/auth/cognito', () => ({
      strategy: jest.fn(),
      authenticate: jest.fn(),
    }));

    process.env.AWS_COGNITO_POOL_ID = 'pool';
    process.env.AWS_COGNITO_CLIENT_ID = 'client';

    const auth = require('../../src/auth');
    expect(auth).toHaveProperty('strategy');
    expect(auth).toHaveProperty('authenticate');
  });

  test('uses Basic Auth if HTPASSWD_FILE is set and not production', () => {
    jest.doMock('../../src/auth/basic-auth', () => ({
      strategy: jest.fn(),
      authenticate: jest.fn(),
    }));

    process.env.HTPASSWD_FILE = 'tests/.htpasswd';
    process.env.NODE_ENV = 'development';

    const auth = require('../../src/auth');
    expect(auth).toHaveProperty('strategy');
    expect(auth).toHaveProperty('authenticate');
  });

  test('throws error if no valid auth configuration is found', () => {
    expect(() => require('../../src/auth')).toThrow(
      /no authorization configuration found/
    );
  });
});
