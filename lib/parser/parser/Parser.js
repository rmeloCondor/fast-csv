const Scanner = require('./Scanner');
const LineParser = require('./LineParser');

class Parser {
    static DEFAULT_OPTIONS() {
        return LineParser.DEFAULT_OPTIONS;
    }

    static removeBOM(data) {
        // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
        // conversion translates it to FEFF (UTF-16 BOM)
        if (data && typeof data === 'string' && data.charCodeAt(0) === '0xFEFF') {
            return data.slice(1);
        }
        return data;
    }


    constructor(options = Parser.DEFAULT_OPTIONS) {
        this.lineParser = new LineParser(options);
    }

    parse(lineStr, hasMoreData) {
        let scanner = new Scanner({
            line: Parser.removeBOM(lineStr),
            delimiter: this.lineParser.delimiter,
            hasMoreData,
        });
        const rows = [];
        let items = [];
        let cursor;
        while (scanner.hasMoreCharacters) {
            const { nextNonSpaceToken } = scanner;
            if (nextNonSpaceToken === null) {
                return { line: scanner.line, rows };
            }
            if (LineParser.isTokenRowDelimiter(nextNonSpaceToken)) {
                scanner = scanner.advancePastToken(nextNonSpaceToken);
                if (scanner.hasMoreCharacters) {
                    rows.push(items);
                    scanner = scanner.truncateToCursor;
                    items = [];
                } else {
                    // if ends with CR and there is more data, keep unparsed due to possible
                    // coming LF in CRLF
                    if (LineParser.isTokenCarriageReturn(nextNonSpaceToken) && hasMoreData) {
                        return { line: scanner.line, rows };
                    }
                    break;
                }
            } else if (this.lineParser.isTokenComment(nextNonSpaceToken)) {
                cursor = scanner.nextCursorAfterComment;
                if (cursor === null) {
                    return { line: scanner.lineFromCursor, rows };
                }
                scanner = scanner.advanceTo(cursor);
                if (!scanner.hasMoreCharacters) {
                    return { line: scanner.lineFromCursor, rows };
                }
            } else {
                scanner = scanner.advanceToToken(nextNonSpaceToken);
                let lineAndItems = { scanner, items: [] };

                if (this.lineParser.isTokenQuote(nextNonSpaceToken)) {
                    lineAndItems = this.lineParser.parseEscapedItem(scanner, hasMoreData);
                } else {
                    lineAndItems = this.lineParser.parseItem(scanner, hasMoreData);
                }
                if (!lineAndItems.items.length) {
                    return { line: scanner.line, rows };
                }
                items = [ ...items, ...lineAndItems.items ];
                // eslint-disable-next-line prefer-destructuring
                scanner = lineAndItems.scanner;
            }
        }
        if (!scanner.hasMoreCharacters) {
            rows.push(items);
        }
        return { line: scanner.lineFromCursor, rows };
    }
}

module.exports = Parser;
