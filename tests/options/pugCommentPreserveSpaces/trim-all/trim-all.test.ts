import { readFileSync } from 'fs';
import { resolve } from 'path';
import { format } from 'prettier';
import { describe, expect, test } from 'vitest';
import { plugin } from './../../../../src/index';

describe('Options', () => {
  describe('pugCommentPreserveSpaces', () => {
    const expected: string = readFileSync(
      resolve(__dirname, 'formatted.pug'),
      'utf8',
    );
    const code: string = readFileSync(
      resolve(__dirname, 'unformatted.pug'),
      'utf8',
    );
    test('should trim all spaces within comments', () => {
      const actual: string = format(code, {
        parser: 'pug',
        plugins: [plugin],

        pugCommentPreserveSpaces: 'trim-all',
      });

      expect(actual).toBe(expected);
    });
  });
});
