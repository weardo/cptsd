import { ResourceType, ResourceCategory } from './Resource';

// Pure-TS smoke test: exercises the client-safe Resource enums.
// These are real exported values with no Mongoose / DB dependency,
// so the test is fully deterministic and requires no live connection.
describe('@cptsd/db Resource types', () => {
  it('exposes ResourceType members with self-mapped string values', () => {
    expect(ResourceType.BOOK).toBe('BOOK');
    expect(ResourceType.HELPLINE).toBe('HELPLINE');
    expect(ResourceType.THERAPY_DIRECTORY).toBe('THERAPY_DIRECTORY');
    // Every enum value should equal its own key (string enum invariant).
    for (const [key, value] of Object.entries(ResourceType)) {
      expect(value).toBe(key);
    }
  });

  it('exposes the expected ResourceCategory members', () => {
    expect(ResourceCategory.THERAPY).toBe('THERAPY');
    expect(Object.values(ResourceCategory)).toEqual(
      expect.arrayContaining([
        'EDUCATION',
        'SUPPORT',
        'THERAPY',
        'SELF_CARE',
        'EMERGENCY',
        'COMMUNITY',
        'RESEARCH',
        'OTHER',
      ])
    );
    expect(Object.keys(ResourceCategory)).toHaveLength(8);
  });
});
