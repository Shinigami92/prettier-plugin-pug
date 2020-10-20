import { AttributeToken } from 'pug-lexer';

export function createAttributeToken(name: string, val: string | boolean = 'dummy'): AttributeToken {
	return {
		name,
		val,
		mustEscape: false,
		type: 'attribute',
		loc: {
			start: { line: 0, column: 0 },
			end: { line: 0, column: 0 }
		}
	};
}
