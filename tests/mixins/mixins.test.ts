import { compareFiles } from 'tests/common';
import { describe, expect, it } from 'vitest';

describe('Mixins', () => {
  it('should handle mixins', async () => {
    const { expected, actual } = await compareFiles(__dirname);
    expect(actual).toBe(expected);
  });
});
