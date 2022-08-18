import { compareFiles } from 'tests/common';
import { describe, expect, it } from 'vitest';

describe('Options', () => {
  describe('pugClassNotation', () => {
    it('should keep classes as is', async () => {
      const { actual, code } = await compareFiles(__dirname, {
        target: null,
        formatOptions: {
          pugClassNotation: 'as-is',
        },
      });
      expect(actual).toBe(code);
    });

    it('should keep classes as literals', async () => {
      const { actual, expected } = await compareFiles(__dirname, {
        target: 'formatted-literal.pug',
        formatOptions: {
          pugClassNotation: 'literal',
        },
      });
      expect(actual).toBe(expected);
    });

    it('should keep classes as attributes', async () => {
      const { actual, expected } = await compareFiles(__dirname, {
        target: 'formatted-attribute.pug',
        formatOptions: {
          pugClassNotation: 'attribute',
        },
      });
      expect(actual).toBe(expected);
    });

    it('should keep classes as literals by default', async () => {
      const { actual, expected } = await compareFiles(__dirname, {
        target: 'formatted-literal.pug',
      });
      expect(actual).toBe(expected);
    });
  });
});
