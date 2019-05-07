const _ = require('lodash');

const ROW_DELIMITER = /(\r\n|\n|\r)/;
const DEFAULT_DELIMITER = ',';
const DEFAULT_OPTIONS = {
    delimiter: DEFAULT_DELIMITER,
    ltrim: false,
    rtrim: false,
    trim: false,
    strictColumnHandling: false,
    quote: '"',
    escape: null,
    comment: null,
};

class LineParser {
    static get DEFAULT_OPTIONS() {
        return DEFAULT_OPTIONS;
    }

    static itemFormatter({ trim, ltrim, rtrim }) {
        return (item) => {
            if (trim) {
                return item.trim();
            }
            if (ltrim) {
                return item.trimLeft();
            }
            if (rtrim) {
                return item.trimRight();
            }
            return item;
        };
    }

    constructor({
        delimiter = LineParser.DEFAULT_OPTIONS.delimiter,
        ltrim = LineParser.DEFAULT_OPTIONS.ltrim,
        rtrim = LineParser.DEFAULT_OPTIONS.rtrim,
        trim = LineParser.DEFAULT_OPTIONS.trim,
        strictColumnHandling = LineParser.DEFAULT_OPTIONS.strictColumnHandling,
        quote = LineParser.DEFAULT_OPTIONS.quote,
        escape = LineParser.DEFAULT_OPTIONS.escape,
        comment = LineParser.DEFAULT_OPTIONS.comment,
    }) {
        this.delimiter = delimiter;
        if (delimiter !== DEFAULT_DELIMITER) {
            if (delimiter.length > 1) {
                throw new Error('delimiter option must be one character long');
            }
            this.delimiter = _.escapeRegExp(delimiter);
        }
        this.formatItem = LineParser.itemFormatter({ ltrim, rtrim, trim });
        this.strictColumnHandling = strictColumnHandling;
        this.quote = quote;
        this.escapeChar = _.isString(escape) ? escape : quote;
        this.comment = comment;
        this.supportsComments = !_.isNil(this.comment);
        this.VALUE_REGEXP = new RegExp(`([^${this.delimiter}'"\\s\\\\]*(?:\\s+[^${this.delimiter}'"\\s\\\\]+)*)`);
        this.SEARCH_REGEXP = new RegExp(`(?:\\n|\\r|${this.delimiter})`);
        this.SPACE_CHAR_REGEX = new RegExp(`(?!${this.delimiter}) `);
    }

    static isTokenRowDelimiter(token) {
        return ROW_DELIMITER.test(token.token);
    }

    static isTokenCarriageReturn(token) {
        return token.token === '\r';
    }

    isTokenComment(token) {
        return this.supportsComments && token.token === this.comment;
    }

    isTokenEscapeCharacter(token) {
        return token && token.token === this.escapeChar;
    }

    isTokenQuote(token) {
        return token && token.token === this.quote;
    }

    isTokenDelimiter(token) {
        return token.token.search(this.delimiter) !== -1;
    }

    isTokenSpaceCharacter(token) {
        return this.SPACE_CHAR_REGEX.test(token.token);
    }

    parseEscapedItem(scanner, hasMoreData) {
        if (!scanner.hasMoreCharacters) {
            return { scanner, items: [] };
        }
        const characters = [];
        let startPushing = false;
        let currentScanner = scanner;
        // scan through finding the next un escaped quote
        while (currentScanner.hasMoreCharacters) {
            const { nextCharacterToken } = currentScanner;
            currentScanner = currentScanner.advancePastToken(nextCharacterToken);
            if (this.isTokenQuote(nextCharacterToken) && !startPushing) {
                // this if block needs to be first to catch the first quote character
                startPushing = true;
            } else if (
                this.isTokenEscapeCharacter(nextCharacterToken)
                && this.isTokenQuote(currentScanner.nextCharacterToken)) {
                // move another character ahead
                currentScanner = currentScanner.advancePastToken(currentScanner.nextCharacterToken);
                characters.push(this.quote);
            } else if (this.isTokenQuote(nextCharacterToken) && startPushing) {
                // this if block needs to be after escape check in case the escape is the same as the quote character
                startPushing = false;
                break;
            } else {
                characters.push(nextCharacterToken.token);
            }
        }
        const item = characters.join('');
        const { nextNonSpaceToken } = currentScanner;
        if (nextNonSpaceToken && this.isTokenDelimiter(nextNonSpaceToken)) {
            if (hasMoreData && !currentScanner.hasMoreCharactersAfterCursor(nextNonSpaceToken.endCursor)) {
                return { scanner, items: [] };
            }
            return { scanner: currentScanner.advancePastToken(nextNonSpaceToken), items: [ this.formatItem(item) ] };
        }
        if (startPushing && !nextNonSpaceToken) {
            if (hasMoreData) {
                return { scanner, items: [] };
            }
            throw new Error(`Parse Error: expected: '${this.escapeChar}' got: '${nextNonSpaceToken.token}'. at '${currentScanner.lineFromCursor.replace(/[r\n]/g, "\\n'")}`);
        }
        if (
            !startPushing
            && nextNonSpaceToken
            && !(LineParser.isTokenRowDelimiter(nextNonSpaceToken) || this.isTokenDelimiter(nextNonSpaceToken))) {
            throw new Error(`Parse Error: expected: '${this.quote}' got: '${nextNonSpaceToken.token}'. at '${currentScanner.lineFromCursor.substr(0, 10)
                .replace(/[\r\n]/g, "\\n'")}`);
        }
        if (hasMoreData && (!nextNonSpaceToken || !LineParser.isTokenRowDelimiter(nextNonSpaceToken))) {
            return { scanner, items: [] };
        }
        return { scanner: currentScanner, items: [ this.formatItem(item) ] };
    }

    parseItem(scanner, hasMoreData) {
        const searchStr = scanner.lineFromCursor;
        let nextDelimiterOrNewLineIndex = searchStr.search(this.SEARCH_REGEXP);
        if (nextDelimiterOrNewLineIndex === -1) {
            if (!this.VALUE_REGEXP.test(searchStr)) {
                throw new Error(`Parse Error: delimiter '${this.delimiter}' not found at '${searchStr.replace(/\n/g, "\\n'")}`);
            } else {
                nextDelimiterOrNewLineIndex = searchStr.length;
            }
        }
        let currentScanner = scanner;
        const items = [];
        const nextChar = searchStr.charAt(nextDelimiterOrNewLineIndex);
        if (nextChar.search(this.delimiter) !== -1) {
            const nextCursor = scanner.cursor + nextDelimiterOrNewLineIndex + 1;
            if (hasMoreData && !scanner.hasMoreCharactersAfterCursor(nextCursor)) {
                return { scanner, items };
            }
            items.push(this.formatItem(searchStr.substr(0, nextDelimiterOrNewLineIndex)));
            currentScanner = scanner.advanceTo(nextCursor);

            const { nextCharacterToken } = currentScanner;
            // if ends with a delimiter, append an empty element, unless strict column handling
            if (!this.strictColumnHandling) {
                if ((!currentScanner.hasMoreCharacters || LineParser.isTokenRowDelimiter(nextCharacterToken))) {
                    items.push('');
                }
                if (nextCharacterToken
                    && this.isTokenSpaceCharacter(nextCharacterToken)
                    && !hasMoreData) {
                    const { nextNonSpaceToken } = currentScanner;
                    if (nextNonSpaceToken && LineParser.isTokenRowDelimiter(nextNonSpaceToken)) {
                        items.push(nextCharacterToken.token);
                    }
                }
            }
            return { scanner: currentScanner, items };
        }
        if (ROW_DELIMITER.test(nextChar)) {
            items.push(this.formatItem(searchStr.substr(0, nextDelimiterOrNewLineIndex)));
            return { scanner: scanner.advanceBy(nextDelimiterOrNewLineIndex), items };
        }
        if (!hasMoreData) {
            items.push(this.formatItem(searchStr.substr(0, nextDelimiterOrNewLineIndex)));
            return { scanner: scanner.advanceBy(nextDelimiterOrNewLineIndex + 1), items };
        }

        return { scanner, items };
    }
}

module.exports = LineParser;
