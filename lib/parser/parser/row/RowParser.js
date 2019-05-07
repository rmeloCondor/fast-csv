const { Token } = require('../Scanner');
const { ColumnParser } = require('../column');

const { isTokenRowDelimiter, isTokenCarriageReturn, isTokenDelimiter } = Token;

class RowParser {
    constructor(parserOptions) {
        this.parserOptions = parserOptions;
        this.columnParser = new ColumnParser(parserOptions);
    }

    parse(scanner) {
        const { parserOptions } = this;
        const { hasMoreData } = scanner;
        const currentScanner = scanner;
        const row = [];
        let currentToken = this._getStartToken(currentScanner, row);
        while (currentToken) {
            if (isTokenRowDelimiter(currentToken, parserOptions)) {
                currentScanner.advancePastToken(currentToken);
                // if ends with CR and there is more data, keep unparsed due to possible
                // coming LF in CRLF
                if (!currentScanner.hasMoreCharacters
                    && isTokenCarriageReturn(currentToken, parserOptions)
                    && hasMoreData) {
                    return null;
                }
                currentScanner.truncateToCursor();
                return row;
            }
            if (!this._shouldSkipColumnParse(currentScanner, currentToken, row)) {
                const item = this.columnParser.parse(currentScanner);
                if (item === null) {
                    return null;
                }
                row.push(item);
            }
            currentToken = currentScanner.nextNonSpaceToken;
        }
        if (!hasMoreData) {
            currentScanner.truncateToCursor();
            return row;
        }
        return null;
    }

    _getStartToken(scanner, row) {
        const currentToken = scanner.nextNonSpaceToken;
        if (isTokenDelimiter(currentToken, this.parserOptions)) {
            row.push('');
            return scanner.nextNonSpaceToken;
        }
        return currentToken;
    }

    _shouldSkipColumnParse(scanner, currentToken, row) {
        const { parserOptions } = this;
        if (isTokenDelimiter(currentToken, parserOptions)) {
            scanner.advancePastToken(currentToken);
            // if the delimiter is at the end of a line
            const nextToken = scanner.nextCharacterToken;
            if (!scanner.hasMoreCharacters || isTokenRowDelimiter(nextToken, parserOptions)) {
                row.push('');
                return true;
            } if (isTokenDelimiter(nextToken, parserOptions)) {
                row.push('');
                return true;
            }
        }
        return false;
    }
}

module.exports = RowParser;
