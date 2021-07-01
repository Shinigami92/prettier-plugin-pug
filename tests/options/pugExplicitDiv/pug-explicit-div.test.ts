import { readFileSync } from 'fs';
import { resolve } from 'path';
import { format, Options } from 'prettier';
import { plugin } from '../../../src/index';

describe('Options', () => {
	describe('pugExplicitDiv', () => {
		const code: string = readFileSync(resolve(__dirname, 'unformatted.pug'), 'utf8');
		const commonOptions: Options = {
			parser: 'pug',
			plugins: [plugin],
			// use this common options in all tests to force specific wrapping
			// @ts-expect-error
			pugAttributeSeparator: 'none',
			pugPrintWidth: 80
		};

		test('should handle unspecified pugExplicitDiv', () => {
			const expected: string = readFileSync(resolve(__dirname, 'formatted-implicit-div.pug'), 'utf8');
			const actual: string = format(code, {
				...commonOptions
			});

			expect(actual).toBe(expected);
		});

		test('should handle pugExplicitDiv:false', () => {
			const expected: string = readFileSync(resolve(__dirname, 'formatted-implicit-div.pug'), 'utf8');
			const actual: string = format(code, {
				...commonOptions,
				// @ts-expect-error
				pugExplicitDiv: false
			});

			expect(actual).toBe(expected);
		});

		test('should handle pugExplicitDiv:true', () => {
			const expected: string = readFileSync(resolve(__dirname, 'formatted-explicit-div.pug'), 'utf8');
			const actual: string = format(code, {
				...commonOptions,
				// @ts-expect-error
				pugExplicitDiv: true
			});

			expect(actual).toBe(expected);
		});
	});
});
