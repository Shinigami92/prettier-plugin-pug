import { compareFiles } from 'tests/common';
import { describe, expect, it } from 'vitest';

describe('Options', () => {
  describe('singleQuote', () => {
    it('should handle singleQuote:true + pugSingleQuote:false', async () => {
      const { actual, expected } = await compareFiles(__dirname, {
        formatOptions: {
          singleQuote: true,
          pugSingleQuote: false,
        },
      });
      expect(actual).toBe(expected);
    });
  });
});
