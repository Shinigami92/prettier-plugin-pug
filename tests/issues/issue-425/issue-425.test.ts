import { compareFiles } from 'tests/common';
import { describe, expect, it } from 'vitest';

describe('Issues', () => {
  it('should trim trailing whitespace after tag', () => {
    const { expected, actual } = compareFiles(__dirname);
    expect(actual).toBe(expected);
  });

  it('should not change', () => {
    const { expected, actual } = compareFiles(__dirname, {
      source: 'formatted.pug',
    });
    expect(actual).toBe(expected);
  });
});
