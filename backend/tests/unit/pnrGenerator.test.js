const { generatePNR } = require('../../src/utils/pnrGenerator');

describe('Unit Tests: Unique PNR Generation', () => {
  test('Generates PNR matching the expected format PNR-{PREFIX}-{6-ALPHANUM}', () => {
    const pnr = generatePNR('ALG');
    expect(pnr).toMatch(/^PNR-ALG-[2-9A-HJ-NP-Z]{6}$/);
  });

  test('Produces unique PNRs without collision across 1,000 generations', () => {
    const set = new Set();
    for (let i = 0; i < 1000; i++) {
      const pnr = generatePNR('ALG');
      expect(set.has(pnr)).toBe(false);
      set.add(pnr);
    }
    expect(set.size).toBe(1000);
  });
});

