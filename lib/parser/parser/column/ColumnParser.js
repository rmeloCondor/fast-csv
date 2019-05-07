const { Token } = require('../Scanner');
const NonQuotedColumnParser = require('./NonQuotedColumnParser');
const QuotedColumnParser = require('./QuotedColumnParser');

class ColumnParser {
    static columnFormatter(parserOptions) {
        if (parserOptions.trim) {
            return item => item.trim();
        }
        if (parserOptions.ltrim) {
            return item => item.trimLeft();
        }
        if (parserOptions.rtrim) {
            return item => item.trimRight();
        }
        return item => item;
    }

    constructor(parserOptions) {
        this.parserOptions = parserOptions;
        const columnFormatter = ColumnParser.columnFormatter(parserOptions);
        this.columnFormatter = columnFormatter;
        this.quotedColumnParser = new QuotedColumnParser({ parserOptions, columnFormatter });
        this.nonQuotedColumnParser = new NonQuotedColumnParser({ parserOptions, columnFormatter });
    }

    parse(scanner) {
        const { nextNonSpaceToken } = scanner;
        if (Token.isTokenQuote(nextNonSpaceToken, this.parserOptions)) {
            scanner.advanceToToken(nextNonSpaceToken);
            return this.quotedColumnParser.parse(scanner);
        }
        return this.nonQuotedColumnParser.parse(scanner);
    }
}

module.exports = ColumnParser;
