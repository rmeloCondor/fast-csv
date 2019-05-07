const ROW_DELIMITER = /((?:\r\n)|\n|\r)/;

class Token {
    static isTokenRowDelimiter(token) {
        if (token) {
            const content = token.token;
            return content === '\r' || content === '\n' || content === '\r\n';
        }
        return false;
    }

    static isTokenCarriageReturn(token, parserOptions) {
        return !!token && token.token === parserOptions.carriageReturn;
    }

    static isTokenComment(token, parserOptions) {
        return parserOptions.supportsComments && !!token && token.token === parserOptions.comment;
    }

    static isTokenEscapeCharacter(token, parserOptions) {
        return !!token && token.token === parserOptions.escapeChar;
    }

    static isTokenQuote(token, parserOptions) {
        return !!token && token.token === parserOptions.quote;
    }

    static isTokenDelimiter(token, parserOptions) {
        return !!token && token.token === parserOptions.delimiter;
    }

    constructor({
        token, startCursor, endCursor,
    }) {
        this.token = token;
        this.startCursor = startCursor;
        this.endCursor = endCursor;
    }
}

class Scanner {
    constructor({
        line,
        parserOptions,
        hasMoreData = false,
        cursor = 0,

    }) {
        this.line = line;
        this.lineLength = line.length;
        this.cursor = cursor;
        this.hasMoreData = hasMoreData;
        this.parserOptions = parserOptions;
    }

    get hasMoreCharacters() {
        return this.lineLength > this.cursor;
    }

    get nextNonSpaceToken() {
        const { lineFromCursor } = this;
        const regex = this.parserOptions.NEXT_TOKEN_REGEXP;
        if (lineFromCursor.search(regex) === -1) {
            return null;
        }
        const match = lineFromCursor.match(regex);
        const token = match[1];
        const startCursor = this.cursor + match.index;
        return new Token({
            token,
            startCursor,
            endCursor: startCursor + token.length - 1,
        });
    }

    get nextCharacterToken() {
        const { cursor, lineLength } = this;
        if (lineLength <= cursor) {
            return null;
        }
        return new Token({
            token: this.line[cursor],
            startCursor: cursor,
            endCursor: cursor,
        });
    }

    get lineFromCursor() {
        return this.line.substr(this.cursor);
    }

    advancePastLine() {
        const match = this.lineFromCursor.match(ROW_DELIMITER);
        if (match == null) {
            if (this.hasMoreData) {
                return null;
            }
            this.cursor = this.lineLength;
            return this;
        }
        this.cursor += match.index + match[0].length;
        return this;
    }

    advanceTo(cursor) {
        this.cursor = cursor;
        return this;
    }

    advanceToToken(token) {
        this.cursor = token.startCursor;
        return this;
    }

    advancePastToken(token) {
        this.cursor = token.endCursor + 1;
        return this;
    }

    truncateToCursor() {
        this.line = this.lineFromCursor;
        this.lineLength = this.line.length;
        this.cursor = 0;
        return this;
    }
}

Scanner.Token = Token;
module.exports = Scanner;
