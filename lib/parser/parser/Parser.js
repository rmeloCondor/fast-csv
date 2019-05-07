const Scanner = require('./Scanner');
const { RowParser } = require('./row');

const { Token } = Scanner;

const EMPTY_ROW_REGEXP = /^\s*(?:''|"")?\s*(?:,\s*(?:''|"")?\s*)*$/;
class Parser {
    static removeBOM(data) {
        // Catches EFBBBF (UTF-8 BOM) because the buffer-to-string
        // conversion translates it to FEFF (UTF-16 BOM)
        if (data && typeof data === 'string' && data.charCodeAt(0) === 0xFEFF) {
            return data.slice(1);
        }
        return data;
    }


    constructor(parserOptions) {
        this.parserOptions = parserOptions;
        this.rowParser = new RowParser(this.parserOptions);
    }

    parse(lineStr, hasMoreData) {
        const scanner = new Scanner({
            line: Parser.removeBOM(lineStr),
            parserOptions: this.parserOptions,
            hasMoreData,
        });
        if (this.parserOptions.supportsComments) {
            return this.__parseWithComments(scanner);
        }
        return this.__parseWithoutComments(scanner);
    }

    __parseWithoutComments(scanner) {
        const rows = [];
        let shouldContinue = true;
        while (shouldContinue) {
            shouldContinue = this.__parseRow(scanner, rows);
        }
        return { line: scanner.line, rows };
    }

    __parseWithComments(scanner) {
        const { parserOptions } = this;
        const rows = [];
        for (let nextToken = scanner.nextCharacterToken; nextToken; nextToken = scanner.nextCharacterToken) {
            if (Token.isTokenComment(nextToken, parserOptions)) {
                const cursor = scanner.advancePastLine();
                if (cursor === null) {
                    return { line: scanner.lineFromCursor, rows };
                }
                if (!scanner.hasMoreCharacters) {
                    return { line: scanner.lineFromCursor, rows };
                }
                scanner.truncateToCursor();
            } else if (!this.__parseRow(scanner, rows)) {
                break;
            }
        }
        return { line: scanner.line, rows };
    }

    __parseRow(scanner, rows) {
        const nextToken = scanner.nextCharacterToken;
        if (!nextToken) {
            return false;
        }
        const row = this.rowParser.parse(scanner);
        if (row === null) {
            return false;
        }
        if (this.parserOptions.ignoreEmptyRow && EMPTY_ROW_REGEXP.test(row.join(''))) {
            return true;
        }
        rows.push(row);
        return true;
    }
}

module.exports = Parser;
