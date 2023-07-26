import { parsers } from 'src/index';
import { compareFiles } from 'tests/common';
import { describe, expect, it } from 'vitest';

describe('Options', () => {
  describe('pugAttributeSeparator', () => {
    it('should never insert commas between attributes', async () => {
      const { actual, expected } = await compareFiles(import.meta.url, {
        formatOptions: {
          // The `.length-test` elements are tested against a `printWidth` of 80 (currently also the default):
          printWidth: 80,

          pugAttributeSeparator: 'none',
        },
      });
      expect(actual).toBe(expected);
    });

    it("should work with 'none' option and angular syntax, but produce invalid output", async () => {
      const { actual, expected } = await compareFiles(import.meta.url, {
        source: 'angular-unformatted.pug',
        target: 'angular-formatted.pug',
        formatOptions: {
          pugAttributeSeparator: 'none',
        },
      });
      expect(actual).toBe(expected);
      expect(() => {
        // ts-jest needs the exclamation mark, so it does not have the impression that the variables are undefined
        parsers!.pug!.parse(actual, null!);
      }).toThrow('Assigning to rvalue');
    });
  });
});
