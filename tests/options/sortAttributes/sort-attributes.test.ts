import { readFileSync } from 'fs';
import { resolve } from 'path';
import { format } from 'prettier';
import { SortAttributes } from '../../../src/options/attribute-sorting/index';
import { compareAttributeToken, stableSort } from '../../../src/options/attribute-sorting/utils';
import { createAttributeToken } from '../../common';
import { plugin } from './../../../src/index';

describe('Options', () => {
	describe('sortAttributes', () => {
		test('should sort attributes', () => {
			const expected: string = readFileSync(resolve(__dirname, 'formatted.pug'), 'utf8');
			const code: string = readFileSync(resolve(__dirname, 'unformatted.pug'), 'utf8');
			const actual: string = format(code, {
				parser: 'pug',
				plugins: [plugin],
				// @ts-ignore
				pugSortAttributesBeginning: ['v-for', ':key', 'src', 'alt'],
				// @ts-ignore
				pugSortAttributesEnd: ['@click']
			});

			expect(actual).toBe(expected);
		});
	});

	describe('sort utilities', () => {
		test('should sort only the beginning attributes', () => {
			const pugSortAttributes: SortAttributes = 'as-is';
			const pugSortAttributesBeginning: string[] = ['v-for', ':key', 'src', 'alt'];
			const pugSortAttributesEnd: string[] = [];
			const expected: ReadonlyArray<string> = ['v-for', ':key', 'src', 'alt'];
			const code: string[] = ['alt', ':key', 'v-for', 'src'];
			const actual: string[] = stableSort(code, (a, b) =>
				compareAttributeToken(
					createAttributeToken(a),
					createAttributeToken(b),
					pugSortAttributes,
					pugSortAttributesBeginning,
					pugSortAttributesEnd
				)
			);

			expect(actual).toStrictEqual(expected);
		});
		test('should sort only the end attributes', () => {
			const pugSortAttributes: SortAttributes = 'as-is';
			const pugSortAttributesBeginning: string[] = [];
			const pugSortAttributesEnd: string[] = ['v-for', ':key', 'src', 'alt', '@click', ':disabled'];
			const expected: ReadonlyArray<string> = ['v-for', ':key', 'src', 'alt', '@click', ':disabled'];
			const code: string[] = ['v-for', ':disabled', ':key', '@click', 'src', 'alt'];
			const actual: string[] = stableSort(code, (a, b) =>
				compareAttributeToken(
					createAttributeToken(a),
					createAttributeToken(b),
					pugSortAttributes,
					pugSortAttributesBeginning,
					pugSortAttributesEnd
				)
			);

			expect(actual).toStrictEqual(expected);
		});
		test('should sort both beginning and end, but keep middle attributes as is', () => {
			const pugSortAttributes: SortAttributes = 'as-is';
			const pugSortAttributesBeginning: string[] = ['^x$', '^y$', '^z$'];
			const pugSortAttributesEnd: string[] = ['v-for', ':key', 'src', 'alt', '@click', ':disabled'];
			const expected: ReadonlyArray<string> = [
				'x',
				'y',
				'z',
				'c',
				'a',
				'b',
				'v-for',
				':key',
				'src',
				'alt',
				'@click',
				':disabled'
			];
			const code: string[] = ['y', 'c', 'z', 'a', ':disabled', 'alt', 'b', ':key', 'v-for', '@click', 'src', 'x'];
			const actual: string[] = stableSort(code, (a, b) =>
				compareAttributeToken(
					createAttributeToken(a),
					createAttributeToken(b),
					pugSortAttributes,
					pugSortAttributesBeginning,
					pugSortAttributesEnd
				)
			);

			expect(actual).toStrictEqual(expected);
		});
		test('should sort beginning, end, and middle should be sorted ascending', () => {
			const pugSortAttributes: SortAttributes = 'asc';
			const pugSortAttributesBeginning: string[] = ['^x$', '^y$', '^z$'];
			const pugSortAttributesEnd: string[] = ['v-for', ':key', 'src', 'alt', '@click', ':disabled'];
			const expected: ReadonlyArray<string> = [
				'x',
				'y',
				'z',
				'D',
				'a',
				'b',
				'c',
				'v-for',
				':key',
				'src',
				'alt',
				'@click',
				':disabled'
			];
			const code: string[] = [
				'y',
				'c',
				'z',
				'a',
				':disabled',
				'alt',
				'b',
				'D',
				':key',
				'v-for',
				'@click',
				'src',
				'x'
			];
			const actual: string[] = stableSort(code, (a, b) =>
				compareAttributeToken(
					createAttributeToken(a),
					createAttributeToken(b),
					pugSortAttributes,
					pugSortAttributesBeginning,
					pugSortAttributesEnd
				)
			);

			expect(actual).toStrictEqual(expected);
		});
		test('should sort beginning, end, and middle should be sorted descending', () => {
			const pugSortAttributes: SortAttributes = 'desc';
			const pugSortAttributesBeginning: string[] = ['^x$', '^y$', '^z$'];
			const pugSortAttributesEnd: string[] = ['v-for', ':key', 'src', 'alt', '@click', ':disabled'];
			const expected: ReadonlyArray<string> = [
				'x',
				'y',
				'z',
				'c',
				'b',
				'a',
				'v-for',
				':key',
				'src',
				'alt',
				'@click',
				':disabled'
			];
			const code: string[] = ['y', 'c', 'z', 'a', ':disabled', 'alt', 'b', ':key', 'v-for', '@click', 'src', 'x'];
			const actual: string[] = stableSort(code, (a, b) =>
				compareAttributeToken(
					createAttributeToken(a),
					createAttributeToken(b),
					pugSortAttributes,
					pugSortAttributesBeginning,
					pugSortAttributesEnd
				)
			);

			expect(actual).toStrictEqual(expected);
		});
		test('should keep middle attributes untouched', () => {
			const pugSortAttributes: SortAttributes = 'as-is';
			const pugSortAttributesBeginning: string[] = ['a'];
			const pugSortAttributesEnd: string[] = ['b'];
			const expected: ReadonlyArray<string> = 'aedcfghilnb'.split('');
			const code: string[] = 'aedcfbghiln'.split('');
			const actual: string[] = stableSort(code, (a, b) =>
				compareAttributeToken(
					createAttributeToken(a),
					createAttributeToken(b),
					pugSortAttributes,
					pugSortAttributesBeginning,
					pugSortAttributesEnd
				)
			);

			expect(actual).toStrictEqual(expected);
		});
		test('should keep every attribute untouched', () => {
			const pugSortAttributes: SortAttributes = 'as-is';
			const pugSortAttributesBeginning: string[] = [];
			const pugSortAttributesEnd: string[] = [];
			const expected: ReadonlyArray<string> = 'aedcfghilnb'.split('');
			const code: string[] = 'aedcfghilnb'.split('');
			const actual: string[] = stableSort(code, (a, b) =>
				compareAttributeToken(
					createAttributeToken(a),
					createAttributeToken(b),
					pugSortAttributes,
					pugSortAttributesBeginning,
					pugSortAttributesEnd
				)
			);

			expect(actual).toStrictEqual(expected);
		});
	});
});
