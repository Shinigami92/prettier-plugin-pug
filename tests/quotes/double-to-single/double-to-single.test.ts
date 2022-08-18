import { compareFiles } from 'tests/common';
import { describe, expect, it } from 'vitest';

describe('Quotes', () => {
  it('should format double to single quotes', async () => {
    const { actual, expected } = await compareFiles(__dirname, {
      formatOptions: {
        singleQuote: true,
      },
    });
    expect(actual).toBe(expected);
  });
});
