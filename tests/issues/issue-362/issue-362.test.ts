import { compareFiles } from 'tests/common';
import { describe, expect, it } from 'vitest';

describe('Issues', () => {
  it('should handle nested quotes in properties', () => {
    const { actual, expected } = compareFiles(__dirname, {
      formatOptions: {
        singleQuote: false,
        pugSingleQuote: false,
        pugFramework: 'vue',
      },
    });
    expect(actual).toBe(expected);
  });
});
