import { checkSafetyKeywords, SafetyLevel } from './safety';

describe('checkSafetyKeywords', () => {
  it('flags HIGH risk for crisis keywords', () => {
    const result = checkSafetyKeywords('Sometimes I just want to die.');
    expect(result.level).toBe(SafetyLevel.HIGH);
    expect(result.signals).toContain('want to die');
  });

  it('flags MEDIUM risk for concerning keywords', () => {
    const result = checkSafetyKeywords('I feel hopeless and overwhelmed today.');
    expect(result.level).toBe(SafetyLevel.MEDIUM);
    expect(result.signals).toEqual(expect.arrayContaining(['hopeless', 'overwhelmed']));
  });

  it('returns NONE with no signals for neutral text', () => {
    const result = checkSafetyKeywords('I had a calm walk and a nice cup of tea.');
    expect(result.level).toBe(SafetyLevel.NONE);
    expect(result.signals).toHaveLength(0);
  });

  it('is case-insensitive when matching keywords', () => {
    const result = checkSafetyKeywords('SUICIDE');
    expect(result.level).toBe(SafetyLevel.HIGH);
  });
});
