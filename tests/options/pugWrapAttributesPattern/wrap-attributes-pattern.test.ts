import { readFileSync } from 'fs';
import { resolve } from 'path';
import { format } from 'prettier';
import { describe, expect, test } from 'vitest';
import { plugin } from './../../../src/index';

describe('Options', () => {
	describe('pugWrapAttributesPattern', () => {
		test('should always wrap elements with attributes matching provided pattern', () => {
			const expected: string = readFileSync(resolve(__dirname, 'formatted.pug'), 'utf8');
			const code: string = readFileSync(resolve(__dirname, 'unformatted.pug'), 'utf8');
			const actual: string = format(code, {
				parser: 'pug',
				plugins: [plugin],

				pugWrapAttributesPattern: '^v-(if|else|for)'
			});

			expect(actual).toBe(expected);
		});
	});
});
