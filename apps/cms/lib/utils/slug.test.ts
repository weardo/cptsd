import { generateSlug } from './slug';

describe('generateSlug', () => {
  it('should generate a slug from a simple string', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('should handle special characters', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world');
  });

  it('should handle multiple spaces', () => {
    expect(generateSlug('Hello   World')).toBe('hello-world');
  });

  it('should handle underscores', () => {
    expect(generateSlug('Hello_World')).toBe('hello-world');
  });

  it('should handle leading and trailing spaces', () => {
    expect(generateSlug('  Hello World  ')).toBe('hello-world');
  });

  it('should handle empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('should handle uppercase', () => {
    expect(generateSlug('HELLO WORLD')).toBe('hello-world');
  });

  it('should handle complex strings', () => {
    expect(generateSlug('CPTSD Awareness - Indian Audience')).toBe('cptsd-awareness-indian-audience');
  });
});

