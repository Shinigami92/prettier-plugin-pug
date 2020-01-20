import { Doc, FastPath, format, Options, Parser, ParserOptions, Plugin, util } from 'prettier';
import * as lex from 'pug-lexer';
import { AttributeToken, EndAttributesToken, Token } from 'pug-lexer';
import { DOCTYPE_SHORTCUT_REGISTRY } from './doctype-shortcut-registry';
import { createLogger, Logger, LogLevel } from './logger';
import {
	formatCommentPreserveSpaces,
	options as pugOptions,
	PugParserOptions,
	resolveAttributeSeparatorOption
} from './options';

const { makeString } = util;

const logger: Logger = createLogger(console);
if (process.env.NODE_ENV === 'test') {
	logger.setLogLevel(LogLevel.DEBUG);
}

function previousNormalAttributeToken(tokens: Token[], index: number): AttributeToken | undefined {
	for (let i: number = index - 1; i > 0; i--) {
		const token: Token = tokens[i];
		if (token.type === 'start-attributes') {
			return;
		}
		if (token.type === 'attribute') {
			if (token.name !== 'class' && token.name !== 'id') {
				return token;
			}
		}
	}
	return;
}

function printIndent(previousToken: Token, indent: string, indentLevel: number): string {
	switch (previousToken?.type) {
		case 'newline':
		case 'outdent':
			return indent.repeat(indentLevel);
		case 'indent':
			return indent;
	}
	return '';
}

function formatText(text: string, singleQuote: boolean): string {
	let result: string = '';
	while (text) {
		const start = text.indexOf('{{');
		if (start !== -1) {
			result += text.slice(0, start);
			text = text.substring(start + 2);
			const end = text.indexOf('}}');
			if (end !== -1) {
				let code = text.slice(0, end);
				code = code.trim();
				code = format(code, { parser: 'babel', singleQuote: !singleQuote, printWidth: 9000 });
				if (code.endsWith(';\n')) {
					code = code.slice(0, -2);
				}
				result += `{{ ${code} }}`;
				text = text.slice(end + 2);
			} else {
				result += '{{';
				result += text;
				text = '';
			}
		} else {
			result += text;
			text = '';
		}
	}
	return result;
}

function unwrapLineFeeds(value: string): string {
	return value.includes('\n')
		? value
				.split('\n')
				.map((part) => part.trim())
				.join('')
		: value;
}

export const plugin: Plugin = {
	languages: [
		{
			name: 'Pug',
			parsers: ['pug'],
			tmScope: 'text.jade',
			aceMode: 'jade',
			codemirrorMode: 'pug',
			codemirrorMimeType: 'text/x-pug',
			extensions: ['.jade', '.pug'],
			linguistLanguageId: 179,
			vscodeLanguageIds: ['jade']
		}
	],
	parsers: {
		pug: {
			parse(text: string, parsers: { [parserName: string]: Parser }, options: ParserOptions): Token[] {
				logger.debug('[parsers:pug:parse]:', { text });
				const tokens = lex(text);
				// logger.debug('[parsers:pug:parse]: tokens', JSON.stringify(tokens, undefined, 2));
				// const ast: AST = parse(tokens, {});
				// logger.debug('[parsers:pug:parse]: ast', JSON.stringify(ast, undefined, 2));
				return tokens;
			},
			astFormat: 'pug-ast',
			hasPragma(text: string): boolean {
				return text.startsWith('//- @prettier\n') || text.startsWith('//- @format\n');
			},
			locStart(node: any): number {
				logger.debug('[parsers:pug:locStart]:', { node });
				return 0;
			},
			locEnd(node: any): number {
				logger.debug('[parsers:pug:locEnd]:', { node });
				return 0;
			},
			preprocess(text: string, options: ParserOptions): string {
				logger.debug('[parsers:pug:preprocess]:', { text });
				return text;
			}
		}
	},
	printers: {
		'pug-ast': {
			print(
				path: FastPath,
				{
					printWidth,
					singleQuote,
					tabWidth,
					useTabs,
					attributeSeparator,
					commentPreserveSpaces,
					semi
				}: ParserOptions & PugParserOptions,
				print: (path: FastPath) => Doc
			): Doc {
				const tokens: Token[] = path.stack[0];

				let result: string = '';
				let indentLevel: number = 0;
				const indent: string = useTabs ? '\t' : ' '.repeat(tabWidth);
				let pipelessText: boolean = false;
				let pipelessComment: boolean = false;

				const alwaysUseAttributeSeparator: boolean = resolveAttributeSeparatorOption(attributeSeparator);

				let possibleIdPosition: number = 0;
				let possibleClassPosition: number = 0;
				let previousAttributeRemapped: boolean = false;
				let wrapAttributes: boolean = false;

				const codeInterpolationOptions: Options = {
					singleQuote: !singleQuote,
					printWidth: 9000,
					endOfLine: 'lf'
				};

				if (tokens[0]?.type === 'text') {
					result += '| ';
				}

				for (let index: number = 0; index < tokens.length; index++) {
					const token: Token = tokens[index];
					const previousToken: Token | undefined = tokens[index - 1];
					const nextToken: Token | undefined = tokens[index + 1];
					logger.debug('[printers:pug-ast:print]:', JSON.stringify(token));
					switch (token.type) {
						case 'tag':
							result += printIndent(previousToken, indent, indentLevel);
							if (!(token.val === 'div' && (nextToken.type === 'class' || nextToken.type === 'id'))) {
								result += token.val;
							}
							possibleIdPosition = result.length;
							possibleClassPosition = result.length;
							break;
						case 'start-attributes':
							if (nextToken?.type === 'attribute') {
								previousAttributeRemapped = false;
								possibleClassPosition = result.length;
								result += '(';
								const start: number = result.lastIndexOf('\n') + 1;
								let lineLength: number = result.substring(start).length;
								logger.debug(lineLength, printWidth);
								let tempToken: AttributeToken | EndAttributesToken = nextToken;
								let tempIndex: number = index + 1;
								while (tempToken.type === 'attribute') {
									lineLength += tempToken.name.length + 1 + tempToken.val.toString().length;
									logger.debug(lineLength, printWidth);
									tempToken = tokens[++tempIndex] as AttributeToken | EndAttributesToken;
								}
								if (lineLength > printWidth) {
									wrapAttributes = true;
								}
							}
							break;
						case 'attribute': {
							if (typeof token.val === 'string') {
								const surroundedByQuotes: boolean =
									(token.val.startsWith('"') && token.val.endsWith('"')) ||
									(token.val.startsWith("'") && token.val.endsWith("'"));
								if (surroundedByQuotes) {
									if (token.name === 'class') {
										// Handle class attribute
										let val = token.val;
										val = val.substring(1, val.length - 1);
										val = val.trim();
										val = val.replace(/\s\s+/g, ' ');
										const classes: string[] = val.split(' ');
										const specialClasses: string[] = [];
										const validClassNameRegex: RegExp = /^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/;
										for (const className of classes) {
											if (!validClassNameRegex.test(className)) {
												specialClasses.push(className);
												continue;
											}
											// Write css-class in front of attributes
											const position: number = possibleClassPosition;
											result = [
												result.slice(0, position),
												`.${className}`,
												result.slice(position)
											].join('');
											possibleClassPosition += 1 + className.length;
											result = result.replace(/div\./, '.');
										}
										if (specialClasses.length > 0) {
											token.val = makeString(
												specialClasses.join(' '),
												singleQuote ? "'" : '"',
												false
											);
											previousAttributeRemapped = false;
										} else {
											previousAttributeRemapped = true;
											break;
										}
									} else if (token.name === 'id') {
										// Handle id attribute
										let val = token.val;
										val = val.substring(1, val.length - 1);
										val = val.trim();
										const validIdNameRegex: RegExp = /^-?[_a-zA-Z]+[_a-zA-Z0-9-]*$/;
										if (!validIdNameRegex.test(val)) {
											val = makeString(val, singleQuote ? "'" : '"', false);
											result += `id=${val}`;
											break;
										}
										// Write css-id in front of css-classes
										const position: number = possibleIdPosition;
										result = [result.slice(0, position), `#${val}`, result.slice(position)].join(
											''
										);
										possibleClassPosition += 1 + val.length;
										result = result.replace(/div#/, '#');
										if (previousToken.type === 'attribute' && previousToken.name !== 'class') {
											previousAttributeRemapped = true;
										}
										break;
									}
								}
							}

							const hasNormalPreviousToken: AttributeToken | undefined = previousNormalAttributeToken(
								tokens,
								index
							);
							if (
								previousToken?.type === 'attribute' &&
								(!previousAttributeRemapped || hasNormalPreviousToken)
							) {
								if (alwaysUseAttributeSeparator || /^(\(|\[|:).*/.test(token.name)) {
									result += ',';
								}
								if (!wrapAttributes) {
									result += ' ';
								}
							}
							previousAttributeRemapped = false;

							if (wrapAttributes) {
								result += '\n';
								result += indent.repeat(indentLevel + 1);
							}

							result += `${token.name}`;
							if (typeof token.val === 'boolean') {
								if (token.val !== true) {
									result += `=${token.val}`;
								}
							} else {
								let val = token.val;
								if (/^((v-bind|v-on|v-slot)?:|v-model|v-on|@).*/.test(token.name)) {
									// Format Vue expression
									val = val.trim();
									val = val.slice(1, -1);
									val = format(val, {
										parser: '__vue_expression' as any,
										...codeInterpolationOptions
									});
									val = unwrapLineFeeds(val);
									const quotes: "'" | '"' = singleQuote ? "'" : '"';
									val = `${quotes}${val}${quotes}`;
								} else if (/^(\(.*\)|\[.*\])$/.test(token.name)) {
									// Format Angular action or binding
									val = val.trim();
									val = val.slice(1, -1);
									val = format(val, {
										parser: '__ng_interpolation' as any,
										...codeInterpolationOptions
									});
									val = unwrapLineFeeds(val);
									const quotes: "'" | '"' = singleQuote ? "'" : '"';
									val = `${quotes}${val}${quotes}`;
								} else if (/^\*.*$/.test(token.name)) {
									// Format Angular directive
									val = val.trim();
									val = val.slice(1, -1);
									val = format(val, { parser: '__ng_directive' as any, ...codeInterpolationOptions });
									const quotes: "'" | '"' = singleQuote ? "'" : '"';
									val = `${quotes}${val}${quotes}`;
								} else if (/^(["']{{)(.*)(}}["'])$/.test(val)) {
									// Format Angular interpolation
									val = val.slice(3, -3);
									val = val.trim();
									val = val.replace(/\s\s+/g, ' ');
									// val = format(val, {
									// 	parser: '__ng_interpolation' as any,
									// 	...codeInterpolationOptions
									// });
									const quotes: "'" | '"' = singleQuote ? "'" : '"';
									val = `${quotes}{{ ${val} }}${quotes}`;
								} else if (/^["'](.*)["']$/.test(val)) {
									val = makeString(val.slice(1, -1), singleQuote ? "'" : '"', false);
								} else if (val === 'true') {
									// The value is exactly true and is not quoted
									break;
								} else if (token.mustEscape) {
									val = format(val, {
										parser: '__js_expression' as any,
										...codeInterpolationOptions
									});
								} else {
									// The value is not quoted and may be js-code
									val = val.trim();
									val = val.replace(/\s\s+/g, ' ');
									if (val.startsWith('{ ')) {
										val = `{${val.substring(2, val.length)}`;
									}
								}

								if (token.mustEscape === false) {
									result += '!';
								}

								result += `=${val}`;
							}
							break;
						}
						case 'end-attributes':
							if (wrapAttributes) {
								result += '\n';
								result += indent.repeat(indentLevel);
							}
							wrapAttributes = false;
							if (result.endsWith('(')) {
								// There were no attributes
								result = result.substring(0, result.length - 1);
							} else if (previousToken?.type === 'attribute') {
								result += ')';
							}
							if (nextToken?.type === 'text' || nextToken?.type === 'path') {
								result += ' ';
							}
							break;
						case 'indent':
							result += '\n';
							result += indent.repeat(indentLevel);
							indentLevel++;
							break;
						case 'outdent':
							if (previousToken?.type !== 'outdent') {
								if (token.loc.start.line - previousToken.loc.end.line > 1) {
									// Insert one extra blank line
									result += '\n';
								}
								result += '\n';
							}
							indentLevel--;
							break;
						case 'class':
							switch (previousToken?.type) {
								case 'newline':
								case 'outdent':
								case 'indent': {
									const prefix = result.slice(0, result.length);
									const _indent = printIndent(previousToken, indent, indentLevel);
									const val = `.${token.val}`;
									result = [prefix, _indent, val, result.slice(result.length)].join('');
									possibleClassPosition = prefix.length + _indent.length + val.length;
									break;
								}
								default: {
									const prefix = result.slice(0, possibleClassPosition);
									const val = `.${token.val}`;
									result = [prefix, val, result.slice(possibleClassPosition)].join('');
									possibleClassPosition = prefix.length + val.length;
									break;
								}
							}
							if (nextToken?.type === 'text') {
								result += ' ';
							}
							break;
						case 'eos':
							// Remove all newlines at the end
							while (result.endsWith('\n')) {
								result = result.substring(0, result.length - 1);
							}
							// Insert one newline
							result += '\n';
							break;
						case 'comment': {
							result += printIndent(previousToken, indent, indentLevel);
							if (previousToken && !['newline', 'indent', 'outdent'].includes(previousToken.type)) {
								result += ' ';
							}
							result += '//';
							if (!token.buffer) {
								result += '-';
							}
							result += formatCommentPreserveSpaces(token.val, commentPreserveSpaces);
							if (nextToken.type === 'start-pipeless-text') {
								pipelessComment = true;
							}
							break;
						}
						case 'newline':
							if (previousToken && token.loc.start.line - previousToken.loc.end.line > 1) {
								// Insert one extra blank line
								result += '\n';
							}
							result += '\n';
							break;
						case 'text': {
							let val = token.val;
							let needsTrailingWhitespace: boolean = false;

							if (pipelessText) {
								switch (previousToken?.type) {
									case 'newline':
										result += indent.repeat(indentLevel + 1);
										break;
									case 'start-pipeless-text':
										result += indent;
										break;
								}

								if (pipelessComment) {
									val = formatCommentPreserveSpaces(val, commentPreserveSpaces, true);
								}
							} else {
								if (nextToken && val.endsWith(' ')) {
									switch (nextToken.type) {
										case 'interpolated-code':
										case 'start-pug-interpolation':
											needsTrailingWhitespace = true;
											break;
									}
								}

								val = val.replace(/\s\s+/g, ' ');

								switch (previousToken?.type) {
									case 'newline':
										result += indent.repeat(indentLevel);
										if (/^ .+$/.test(val)) {
											result += '|\n';
											result += indent.repeat(indentLevel);
										}
										result += '|';
										if (/.*\S.*/.test(token.val) || nextToken?.type === 'start-pug-interpolation') {
											result += ' ';
										}
										break;
									case 'indent':
										result += indent;
										result += '|';
										if (/.*\S.*/.test(token.val)) {
											result += ' ';
										}
										break;
									case 'interpolated-code':
									case 'end-pug-interpolation':
										if (/^ .+$/.test(val)) {
											result += ' ';
										}
										break;
								}

								val = val.trim();
								val = formatText(val, singleQuote);

								val = val.replace(/#(\{|\[)/g, '\\#$1');
							}

							if (
								['tag', 'id', 'interpolation', 'call', '&attributes', 'filter'].includes(
									previousToken?.type
								)
							) {
								val = ` ${val}`;
							}

							result += val;
							if (needsTrailingWhitespace) {
								result += ' ';
							}
							break;
						}
						case 'interpolated-code':
							switch (previousToken?.type) {
								case 'tag':
								case 'class':
								case 'id':
								case 'end-attributes':
									result += ' ';
									break;
								case 'start-pug-interpolation':
									result += '| ';
									break;
								case 'indent':
								case 'newline':
								case 'outdent':
									result += printIndent(previousToken, indent, indentLevel);
									result += '| ';
									break;
							}
							result += token.mustEscape ? '#' : '!';
							result += `{${token.val}}`;
							break;
						case 'code': {
							result += printIndent(previousToken, indent, indentLevel);
							if (!token.mustEscape && token.buffer) {
								result += '!';
							}
							result += token.buffer ? '=' : '-';
							let useSemi = semi;
							if (useSemi && (token.mustEscape || token.buffer)) {
								useSemi = false;
							}
							let val = token.val;
							try {
								const valBackup = val;
								val = format(val, {
									parser: 'babel',
									...codeInterpolationOptions,
									semi: useSemi,
									endOfLine: 'lf'
								});
								val = val.slice(0, -1);
								if (val.includes('\n')) {
									val = valBackup;
								}
							} catch (error) {
								logger.warn(error);
							}
							result += ` ${val}`;
							break;
						}
						case 'id': {
							switch (previousToken?.type) {
								case 'newline':
								case 'outdent':
								case 'indent': {
									const prefix = result.slice(0, result.length);
									const _indent = printIndent(previousToken, indent, indentLevel);
									const val = `#${token.val}`;
									result = [prefix, _indent, val, result.slice(result.length)].join('');
									possibleClassPosition = prefix.length + _indent.length + val.length;
									break;
								}
								default: {
									const prefix = result.slice(0, possibleIdPosition);
									const val = `#${token.val}`;
									result = [prefix, val, result.slice(possibleIdPosition)].join('');
									possibleClassPosition = prefix.length + val.length;
									break;
								}
							}
							break;
						}
						case 'start-pipeless-text':
							pipelessText = true;
							result += '\n';
							result += indent.repeat(indentLevel);
							break;
						case 'end-pipeless-text':
							pipelessText = false;
							pipelessComment = false;
							break;
						case 'doctype':
							result += 'doctype';
							if (token.val) {
								result += ` ${token.val}`;
							}
							break;
						case 'dot':
							result += '.';
							break;
						case 'block':
							result += printIndent(previousToken, indent, indentLevel);
							result += 'block ';
							if (token.mode !== 'replace') {
								result += token.mode;
								result += ' ';
							}
							result += token.val;
							break;
						case 'extends':
							result += 'extends ';
							break;
						case 'path':
							if (['include', 'filter'].includes(previousToken?.type)) {
								result += ' ';
							}
							result += token.val;
							break;
						case 'start-pug-interpolation':
							result += '#[';
							break;
						case 'end-pug-interpolation':
							result += ']';
							break;
						case 'interpolation':
							result += printIndent(previousToken, indent, indentLevel);
							result += `#{${token.val}}`;
							possibleIdPosition = result.length;
							possibleClassPosition = result.length;
							break;
						case 'include':
							result += printIndent(previousToken, indent, indentLevel);
							result += 'include';
							break;
						case 'filter':
							result += printIndent(previousToken, indent, indentLevel);
							result += `:${token.val}`;
							break;
						case 'call': {
							result += printIndent(previousToken, indent, indentLevel);
							result += `+${token.val}`;
							let args: string | null = token.args;
							if (args) {
								args = args.trim();
								args = args.replace(/\s\s+/g, ' ');
								result += `(${args})`;
							}
							possibleIdPosition = result.length;
							possibleClassPosition = result.length;
							break;
						}
						case 'mixin': {
							result += printIndent(previousToken, indent, indentLevel);
							result += `mixin ${token.val}`;
							let args: string | null = token.args;
							if (args) {
								args = args.trim();
								args = args.replace(/\s\s+/g, ' ');
								result += `(${args})`;
							}
							break;
						}
						case 'if': {
							result += printIndent(previousToken, indent, indentLevel);
							const match = /^!\((.*)\)$/.exec(token.val);
							logger.debug(match);
							result += !match ? `if ${token.val}` : `unless ${match[1]}`;
							break;
						}
						case 'mixin-block':
							result += printIndent(previousToken, indent, indentLevel);
							result += 'block';
							break;
						case 'else':
							result += printIndent(previousToken, indent, indentLevel);
							result += 'else';
							break;
						case '&attributes':
							result += `&attributes(${token.val})`;
							break;
						case 'text-html': {
							result += printIndent(previousToken, indent, indentLevel);
							const match: RegExpExecArray | null = /^<(.*?)>(.*)<\/(.*?)>$/.exec(token.val);
							logger.debug(match);
							if (match) {
								result += `${match[1]} ${match[2]}`;
								break;
							}
							const entry = Object.entries(DOCTYPE_SHORTCUT_REGISTRY).find(
								([key]) => key === token.val.toLowerCase()
							);
							if (entry) {
								result += entry[1];
								break;
							}
							result += token.val;
							break;
						}
						case 'each':
							result += printIndent(previousToken, indent, indentLevel);
							result += `each ${token.val}`;
							if (token.key !== null) {
								result += `, ${token.key}`;
							}
							result += ` in ${token.code}`;
							break;
						case 'while':
							result += printIndent(previousToken, indent, indentLevel);
							result += `while ${token.val}`;
							break;
						case 'case':
							result += printIndent(previousToken, indent, indentLevel);
							result += `case ${token.val}`;
							break;
						case 'when':
							result += printIndent(previousToken, indent, indentLevel);
							result += `when ${token.val}`;
							break;
						case ':':
							result += ': ';
							possibleIdPosition = result.length;
							possibleClassPosition = result.length;
							break;
						case 'default':
							result += printIndent(previousToken, indent, indentLevel);
							result += 'default';
							break;
						case 'else-if':
							result += printIndent(previousToken, indent, indentLevel);
							result += `else if ${token.val}`;
							break;
						case 'blockcode':
							result += printIndent(previousToken, indent, indentLevel);
							result += '-';
							break;
						case 'yield':
							result += printIndent(previousToken, indent, indentLevel);
							result += 'yield';
							break;
						case 'slash':
							result += '/';
							break;
						default:
							throw new Error('Unhandled token: ' + JSON.stringify(token));
					}
				}

				logger.debug(result);
				return result;
			},
			embed(
				path: FastPath,
				print: (path: FastPath) => Doc,
				textToDoc: (text: string, options: Options) => Doc,
				options: ParserOptions
			): Doc | null {
				// logger.debug('[printers:pug-ast:embed]:', JSON.stringify(path, undefined, 2));
				return null;
			},
			insertPragma(text: string): string {
				return `//- @prettier\n${text}`;
			}
		}
	},
	options: pugOptions as any,
	defaultOptions: {}
};

export const languages = plugin.languages;
export const parsers = plugin.parsers;
export const printers = plugin.printers;
export const options = plugin.options;
export const defaultOptions = plugin.defaultOptions;
