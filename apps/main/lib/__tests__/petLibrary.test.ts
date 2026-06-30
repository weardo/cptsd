import {
  getPetConfig,
  getAllPetTypes,
  getRandomPetType,
  PetType,
} from '../petLibrary';

describe('petLibrary', () => {
  it('returns the full, deterministic set of pet types', () => {
    expect(getAllPetTypes()).toEqual([
      'cat',
      'dog',
      'bird',
      'rabbit',
      'butterfly',
      'leaf',
    ]);
  });

  it('returns a config with name, svg and at least one message for each type', () => {
    for (const type of getAllPetTypes()) {
      const config = getPetConfig(type);
      expect(config.name).toEqual(expect.any(String));
      expect(config.svg).toContain('<svg');
      expect(config.messages.length).toBeGreaterThan(0);
    }
  });

  it('returns a known config for a specific type', () => {
    const cat = getPetConfig('cat');
    expect(cat.name).toBe('Calm Cat');
    expect(cat.messages).toContain('You are not broken.');
  });

  it('always returns a valid registered pet type from getRandomPetType', () => {
    const valid = new Set<PetType>(getAllPetTypes());
    // Drive Math.random to its boundaries to keep the assertion deterministic.
    const spy = jest.spyOn(Math, 'random');
    try {
      for (const value of [0, 0.5, 0.999999]) {
        spy.mockReturnValue(value);
        expect(valid.has(getRandomPetType())).toBe(true);
      }
    } finally {
      spy.mockRestore();
    }
  });
});
