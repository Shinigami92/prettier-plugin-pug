import { compareFiles } from 'tests/common';
import { describe, expect, it } from 'vitest';

describe('Issues', () => {
  it('should format v-t directive from vue-i18n', async () => {
    const { actual, expected } = await compareFiles(__dirname, {
      formatOptions: {
        pugFramework: 'vue',
      },
    });
    expect(actual).toBe(expected);
  });
});
