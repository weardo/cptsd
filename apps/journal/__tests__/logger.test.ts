import { createLogger, generateRequestId } from '@/lib/logger';

describe('lib/logger', () => {
  describe('generateRequestId', () => {
    it('produces an id with the req_ prefix', () => {
      expect(generateRequestId()).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('produces unique ids on successive calls', () => {
      const a = generateRequestId();
      const b = generateRequestId();
      expect(a).not.toBe(b);
    });
  });

  describe('createLogger', () => {
    it('returns a logger exposing info, error and warn methods', () => {
      const logger = createLogger();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
    });

    it('prefixes log output with the request id', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      try {
        createLogger('req_test_123').info('hello');
        expect(spy).toHaveBeenCalledWith('[req_test_123] [INFO] hello');
      } finally {
        spy.mockRestore();
      }
    });

    it('redacts sensitive journal content from logged meta', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      try {
        createLogger().info('saving', { rawText: 'secret diary' });
        const loggedMeta = spy.mock.calls[0][1];
        expect(JSON.stringify(loggedMeta)).not.toContain('rawText');
        expect(JSON.stringify(loggedMeta)).toContain('[REDACTED]');
      } finally {
        spy.mockRestore();
      }
    });
  });
});
