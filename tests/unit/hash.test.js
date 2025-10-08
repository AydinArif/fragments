const hash = require('../../src/hash');

describe('hash()', () => {
  test('same email → same hash', () => {
    expect(hash('Alice@Example.com')).toBe(hash('alice@example.com'));
  });

  test('different emails → different hashes', () => {
    expect(hash('a@example.com')).not.toBe(hash('b@example.com'));
  });

  test('throws on empty', () => {
    expect(() => hash()).toThrow();
  });
});
