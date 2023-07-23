import { compareFiles } from 'tests/common';
import { describe, expect, it } from 'vitest';

describe('Issues', () => {
  it('should preserve multi-root nodes', async () => {
    const { expected, actual } = await compareFiles(__dirname);
    expect(actual).toBe(expected);
  });

  it('should preserve multi-root nodes with pugSingleFileComponentIndentation', async () => {
    const { actual, expected } = await compareFiles(__dirname, {
      source: 'unformatted.vue',
      target: 'formatted.vue',
      formatOptions: {
        parser: 'vue',

        pugSingleFileComponentIndentation: true,
      },
    });
    expect(actual).toBe(expected);
  });

  it('should preserve multi-root nodes with pugSingleFileComponentIndentation for extends', async () => {
    const { actual, expected } = await compareFiles(__dirname, {
      source: 'extends-unformatted.vue',
      target: 'extends-formatted.vue',
      formatOptions: {
        parser: 'vue',
        tabWidth: 4,

        pugSingleFileComponentIndentation: true,
      },
    });
    expect(actual).toBe(expected);
  });
});
