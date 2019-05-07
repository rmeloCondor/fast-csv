const assert = require('assert');
const sinon = require('sinon');
const ParserOptions = require('../../../../lib/parser/ParserOptions');
const { ColumnParser } = require('../../../../lib/parser/parser/column');
const Scanner = require('../../../../lib/parser/parser/Scanner');

describe('ColumnParser', () => {
    describe('#parse', () => {
        describe('with un-quoted data', () => {
            it('should call the nonQuotedColumnParser', () => {
                const line = 'HELLO';
                const parserOptions = new ParserOptions({});
                const lineParser = new ColumnParser(parserOptions);
                const scanner = new Scanner({ line, parserOptions, hasMoreData: true });
                const expectedResult = { scanner, items: [] };
                const mock = sinon.mock(lineParser.nonQuotedColumnParser);
                mock.expects('parse').once().withArgs(scanner).returns(expectedResult);
                assert.deepStrictEqual(lineParser.parse(scanner), expectedResult);
                mock.verify();
            });
        });
        describe('with quoted data', () => {
            it('should call the quotedColumnParser', () => {
                const line = '"HELLO"';
                const parserOptions = new ParserOptions({});
                const lineParser = new ColumnParser(parserOptions);
                const scanner = new Scanner({ line, parserOptions, hasMoreData: true });
                const expectedResult = { scanner, items: [] };
                const mock = sinon.mock(lineParser.quotedColumnParser);
                mock.expects('parse').once().withArgs(scanner).returns(expectedResult);
                assert.deepStrictEqual(lineParser.parse(scanner), expectedResult);
                mock.verify();
            });
        });
    });

    describe('columnFormatter', () => {
        it('should create an item formatter that trims white space if trim is true', () => {
            const parserOptions = new ParserOptions({});
            const lineParser = new ColumnParser({ parserOptions, trim: true });

            assert.strictEqual(lineParser.columnFormatter('   HELLO   '), 'HELLO');
        });

        it('should create an item formatter that trims white space from the left if ltrim is true', () => {
            const parserOptions = new ParserOptions({});
            const lineParser = new ColumnParser({ parserOptions, ltrim: true });

            assert.strictEqual(lineParser.columnFormatter('   HELLO   '), 'HELLO   ');
        });

        it('should create an item formatter that trims white space from the right if ltrim is true', () => {
            const parserOptions = new ParserOptions({});
            const lineParser = new ColumnParser({ parserOptions, rtrim: true });

            assert.strictEqual(lineParser.columnFormatter('   HELLO   '), '   HELLO');
        });
    });
});
