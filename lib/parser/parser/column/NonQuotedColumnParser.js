const { Token } = require('../Scanner');

const { isTokenDelimiter, isTokenRowDelimiter } = Token;

class NonQuotedColumnParser {
    constructor({
        parserOptions,
        columnFormatter,
    }) {
        this.parserOptions = parserOptions;
        this.columnFormatter = columnFormatter;
    }

    parse(scanner) {
        if (!scanner.hasMoreCharacters) {
            return null;
        }
        const { parserOptions } = this;
        const characters = [];
        let nextToken = scanner.nextCharacterToken;
        for (; nextToken; nextToken = scanner.nextCharacterToken) {
            if (isTokenDelimiter(nextToken, parserOptions) || isTokenRowDelimiter(nextToken, parserOptions)) {
                break;
            }
            characters.push(nextToken.token);
            scanner.advancePastToken(nextToken);
        }
        return this.columnFormatter(characters.join(''));
    }
}

module.exports = NonQuotedColumnParser;
