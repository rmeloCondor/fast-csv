const assert = require('assert');
const ParserOptions = require('../../../../lib/parser/ParserOptions');
const { NonQuotedColumnParser } = require('../../../../lib/parser/parser/column');
const Scanner = require('../../../../lib/parser/parser/Scanner');

describe('NonQuotedColumnParser', () => {
    const itemFormatter = column => column;
    const parse = (
        line,
        hasMoreData = false,
        parserOpts = { },
        columnFormatter = item => item
    ) => {
        const parserOptions = new ParserOptions(parserOpts);
        const columnParser = new NonQuotedColumnParser({ parserOptions, columnFormatter });
        const scanner = new Scanner({ line, parserOptions, hasMoreData });
        return { scanner, col: columnParser.parse(scanner) };
    };

    describe('#parse', () => {
        describe('with default delimiter', () => {
            it('should return the same scanner if there is no data', () => {
                const line = '';
                const parserOptions = new ParserOptions({});
                const lineParser = new NonQuotedColumnParser({ parserOptions, itemFormatter });
                const scanner = new Scanner({ line, parserOptions, hasMoreData: true });
                assert.strictEqual(lineParser.parse(scanner), null);
            });

            it('should parse a column up to a column delimiter', () => {
                const line = 'hello,world';
                const { scanner, col } = parse(line, true);
                assert.strictEqual(col, 'hello');
                assert.strictEqual(scanner.lineFromCursor, ',world');
            });

            it('should parse a column when not followed by any characters', () => {
                const line = 'hello';
                const { scanner, col } = parse(line, true);
                assert.strictEqual(col, 'hello');
                assert.strictEqual(scanner.lineFromCursor, '');
            });

            it('should parse a column up to a LF', () => {
                const line = 'hello\nworld';
                const { scanner, col } = parse(line, true);
                assert.strictEqual(col, 'hello');
                assert.strictEqual(scanner.lineFromCursor, '\nworld');
            });

            it('should parse a column up to a CR', () => {
                const line = 'hello\rworld';
                const { scanner, col } = parse(line, true);
                assert.strictEqual(col, 'hello');
                assert.strictEqual(scanner.lineFromCursor, '\rworld');
            });

            it('should parse a column up to a CRLF', () => {
                const line = 'hello\r\nworld';
                const { scanner, col } = parse(line, true);
                assert.strictEqual(col, 'hello');
                assert.strictEqual(scanner.lineFromCursor, '\r\nworld');
            });


            describe('columnFormatter option', () => {
                it('should use the column formatter', () => {
                    const line = '   hello   ';
                    const { scanner, col } = parse(line, true, { }, column => column.trimLeft());
                    assert.strictEqual(col, 'hello   ');
                    assert.strictEqual(scanner.lineFromCursor, '');
                });
            });
        });

        describe('with non-default delimiter', () => {
            it('should return the same scanner if there is no data', () => {
                const line = '';
                const parserOptions = new ParserOptions({ delimiter: '\t' });
                const lineParser = new NonQuotedColumnParser({ parserOptions, itemFormatter });
                const scanner = new Scanner({ line, parserOptions, hasMoreData: true });
                assert.strictEqual(lineParser.parse(scanner), null);
                assert.strictEqual(scanner, scanner);
            });

            it('should parse a column when not followed by any characters', () => {
                const line = 'hello';
                const { scanner, col } = parse(line, true, { delimiter: '\t' });
                assert.strictEqual(col, 'hello');
                assert.strictEqual(scanner.lineFromCursor, '');
            });


            it('should parse a column up to the column delimiter', () => {
                const line = 'hello\tworld';
                const { scanner, col } = parse(line, true, { delimiter: '\t' });
                assert.strictEqual(col, 'hello');
                assert.strictEqual(scanner.lineFromCursor, '\tworld');
            });

            it('should include all white space up to a column delimiter', () => {
                const line = '    \t    ';
                const { scanner, col } = parse(line, true, { delimiter: '\t' });
                assert.strictEqual(col, '    ');
                assert.strictEqual(scanner.lineFromCursor, '\t    ');
            });

            it('should parse a column up to a LF', () => {
                const line = 'hello\nworld';
                const { scanner, col } = parse(line, true, { delimiter: '\t' });
                assert.strictEqual(col, 'hello');
                assert.strictEqual(scanner.lineFromCursor, '\nworld');
            });

            it('should parse a column up to a CR', () => {
                const line = 'hello\rworld';
                const { scanner, col } = parse(line, true, { delimiter: '\t' });
                assert.strictEqual(col, 'hello');
                assert.strictEqual(scanner.lineFromCursor, '\rworld');
            });

            it('should parse a column up to a CRLF', () => {
                const line = 'hello\r\nworld';
                const { scanner, col } = parse(line, true, { delimiter: '\t' });
                assert.strictEqual(col, 'hello');
                assert.strictEqual(scanner.lineFromCursor, '\r\nworld');
            });

            describe('columnFormatter option', () => {
                it('should trim white space from both ends when trim is true', () => {
                    const line = '   hello   \t';
                    const { scanner, col } = parse(line, true, { delimiter: '\t' }, column => column.trimLeft());
                    assert.strictEqual(col, 'hello   ');
                    assert.strictEqual(scanner.lineFromCursor, '\t');
                });
            });
        });
    });
});
