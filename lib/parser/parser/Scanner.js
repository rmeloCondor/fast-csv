const ROW_DELIMITER = /(\r\n|\n|\r)/;

class Token {
    constructor({
        line, token, startCursor, endCursor,
    }) {
        this.line = line;
        this.token = token;
        this.startCursor = startCursor;
        this.endCursor = endCursor;
    }
}

class Scanner {
    constructor({
        line,
        delimiter,
        hasMoreData = false,
        cursor = 0,
    }) {
        this.line = line;
        this.cursor = cursor;
        this.hasMoreData = hasMoreData;
        this.delimiter = delimiter;
        this.NEXT_TOKEN_REGEXP = new RegExp(`([^\\s]|\\r\\n|\\n|\\r|${delimiter})`);
    }

    get hasMoreCharacters() {
        return this.hasMoreCharactersAfterCursor(this.cursor);
    }

    hasMoreCharactersAfterCursor(cursor) {
        return this.line.length > cursor;
    }

    get nextNonSpaceToken() {
        const { lineFromCursor } = this;
        const nextIndex = lineFromCursor.search(this.NEXT_TOKEN_REGEXP);
        if (nextIndex === -1) {
            return null;
        }
        const tokenLen = lineFromCursor.match(this.NEXT_TOKEN_REGEXP)[1].length;
        const startCursor = this.cursor + nextIndex;
        return new Token({
            line: this,
            token: lineFromCursor.substr(nextIndex, tokenLen),
            startCursor,
            endCursor: startCursor + tokenLen,
        });
    }

    get nextCharacterToken() {
        if (!this.hasMoreCharacters) {
            return null;
        }
        return new Token({
            line: this,
            token: this.lineFromCursor.substr(0, 1),
            startCursor: this.cursor,
            endCursor: this.cursor + 1,
        });
    }

    get lineFromCursor() {
        return this.line.substr(this.cursor);
    }

    get nextCursorAfterComment() {
        const nextIndex = this.lineFromCursor.search(ROW_DELIMITER);
        if (nextIndex === -1) {
            if (this.hasMoreData) {
                return null;
            }
            return this.line.length + 1;
        }
        return (this.cursor + nextIndex) + 1; // go past the next line break;
    }

    advanceBy(offset) {
        return new Scanner({
            line: this.line,
            delimiter: this.delimiter,
            hasMoreData: this.hasMoreData,
            cursor: this.cursor + offset,
        });
    }

    advanceTo(cursor) {
        return new Scanner({
            line: this.line,
            delimiter: this.delimiter,
            hasMoreData: this.hasMoreData,
            cursor,
        });
    }

    advanceToToken(token) {
        return new Scanner({
            line: this.line,
            delimiter: this.delimiter,
            cursor: token.endCursor - 1,
            hasMoreData: this.hasMoreData,
        });
    }

    advancePastToken(token) {
        return new Scanner({
            line: this.line,
            delimiter: this.delimiter,
            cursor: token.endCursor,
            hasMoreData: this.hasMoreData,
        });
    }

    get truncateToCursor() {
        return new Scanner({
            line: this.lineFromCursor,
            delimiter: this.delimiter,
            cursor: 0,
            hasMoreData: this.hasMoreData,
        });
    }
}

module.exports = Scanner;
