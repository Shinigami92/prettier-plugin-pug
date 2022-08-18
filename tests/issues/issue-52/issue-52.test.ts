import { compareFiles } from 'tests/common';
import { describe, expect, it } from 'vitest';

describe('Issues', () => {
  it('should handle literal line', async () => {
    const { expected, actual } = await compareFiles(__dirname);
    expect(actual).toBe(expected);
  });
});
