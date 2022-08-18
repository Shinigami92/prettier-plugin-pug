import { compareFiles } from 'tests/common';
import { describe, expect, it } from 'vitest';

describe('Attributes', () => {
  it('should shorten truthy attributes', async () => {
    const { expected, actual } = await compareFiles(__dirname);
    expect(actual).toBe(expected);
  });
});
