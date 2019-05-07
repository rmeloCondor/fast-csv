const assert = require('assert');
const { Parser } = require('../../lib/parser/parser');
const ParserOptions = require('../../lib/parser/ParserOptions');

describe('Issue #150 - https://github.com/C2FO/fast-csv/issues/150', () => {
    const createParser = (parserOptions = {}) => new Parser(new ParserOptions(parserOptions));
    const runParser = (data, hasMoreData, parser) => parser.parse(data, hasMoreData);

    it('should not parse a row if a new line is a CR and there is more data', () => {
        const data = 'first_name,last_name,email_address\r';
        const myParser = createParser({});
        const parsedData = runParser(data, true, myParser);
        assert.deepStrictEqual(parsedData, {
            line: 'first_name,last_name,email_address\r',
            rows: [],
        });
    });
});
