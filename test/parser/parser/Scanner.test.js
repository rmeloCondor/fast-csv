const assert = require('assert');
const ParserOptions = require('../../../lib/parser/ParserOptions');
const Scanner = require('../../../lib/parser/parser/Scanner');

const { Token } = Scanner;

const createOptions = (opts = {}) => new ParserOptions(opts);

describe('Scanner', () => {
    const getScanner = (line, hasMoreData, cursor = 0, parserOpts = {}) => new Scanner({
        line,
        parserOptions: createOptions(parserOpts),
        hasMoreData,
        cursor,
    });

    describe('#hasMoreCharacters', () => {
        it('should return true if the cursor is not past the end of the line', () => {
            assert.strictEqual(getScanner('hello', true).hasMoreCharacters, true);
        });

        it('should return true if the cursor is not past the end of the line', () => {
            assert.strictEqual(getScanner('hello', true, 5).hasMoreCharacters, false);
        });
    });

    describe('#nextNonSpaceToken', () => {
        it('should get non space token in the line', () => {
            assert.strictEqual(getScanner(' h', true, 0).nextNonSpaceToken.token, 'h');
        });

        it('should get the LF in the line', () => {
            assert.strictEqual(getScanner(' \n', true, 0).nextNonSpaceToken.token, '\n');
        });

        it('should get the CR in the line', () => {
            assert.strictEqual(getScanner(' \r', true, 0).nextNonSpaceToken.token, '\r');
        });

        it('should get the CRLF in the line', () => {
            assert.strictEqual(getScanner(' \r\n', true, 0).nextNonSpaceToken.token, '\r\n');
        });

        it('should return null if there is nothing but white space', () => {
            assert.strictEqual(getScanner('    \t', true, 0).nextNonSpaceToken, null);
        });

        it('should return a token the delimiter is a space token', () => {
            assert.strictEqual(
                getScanner('   \t', true, 0, { delimiter: '\t' })
                    .nextNonSpaceToken.token,
                '\t'
            );
        });
    });

    describe('#nextCharacterToken', () => {
        it('should get the next character in the line', () => {
            assert.strictEqual(getScanner('h', true, 0).nextCharacterToken.token, 'h');
        });

        it('should get the next character in the line if it it whitespace', () => {
            assert.strictEqual(getScanner(' h', true, 0).nextCharacterToken.token, ' ');
        });

        it('should return null if the cursor is at the end of the line', () => {
            assert.strictEqual(getScanner('hello', true, 5).nextCharacterToken, null);
        });
    });

    describe('#line from cursor', () => {
        it('should return the line from the current cursor', () => {
            assert.strictEqual(getScanner('hello', true, 2).lineFromCursor, 'llo');
        });
    });

    describe('#advancePastLine', () => {
        it('should advance past the next LF', () => {
            const scanner = getScanner('hel\nlo', true, 2);
            scanner.advancePastLine();
            assert.strictEqual(scanner.lineFromCursor, 'lo');
        });

        it('should advance past the next CR', () => {
            const scanner = getScanner('hel\rlo', true, 2);
            scanner.advancePastLine();
            assert.strictEqual(scanner.lineFromCursor, 'lo');
        });

        it('should advance past the next CRLF', () => {
            const scanner = getScanner('hel\r\nlo', true, 2);
            scanner.advancePastLine();
            assert.strictEqual(scanner.lineFromCursor, 'lo');
        });
    });

    describe('#advancePastLine', () => {
        it('should advance past the next LF', () => {
            const scanner = getScanner('hel\nlo', true, 2);
            scanner.advancePastLine();
            assert.strictEqual(scanner.lineFromCursor, 'lo');
        });

        it('should advance past the next CR', () => {
            const scanner = getScanner('hel\rlo', true, 2);
            scanner.advancePastLine();
            assert.strictEqual(scanner.lineFromCursor, 'lo');
        });

        it('should advance past the next CRLF', () => {
            const scanner = getScanner('hel\r\nlo', true, 2);
            scanner.advancePastLine();
            assert.strictEqual(scanner.lineFromCursor, 'lo');
        });
    });

    describe('#advanceTo', () => {
        it('should set the cursor to the supplied value', () => {
            assert.strictEqual(getScanner('hello', true, 0).advanceTo(2).cursor, 2);
        });
    });

    describe('#advanceToToken', () => {
        it('should set the cursor to the supplied value', () => {
            const scanner = getScanner('hello', true, 0);
            const token = scanner.nextCharacterToken;
            assert.strictEqual(scanner.advanceToToken(token).cursor, token.startCursor);
        });
    });

    describe('#advancePastToken', () => {
        it('should set the cursor to the supplied value', () => {
            const scanner = getScanner('hello', true, 0);
            const token = scanner.nextCharacterToken;
            assert.strictEqual(scanner.advancePastToken(token).cursor, token.endCursor + 1);
        });
    });

    describe('#truncateToCursor', () => {
        it('should set the cursor to the supplied value', () => {
            const scanner = getScanner('hello', true, 2).truncateToCursor();
            assert.strictEqual(scanner.line, 'llo');
            assert.strictEqual(scanner.lineLength, 3);
            assert.strictEqual(scanner.cursor, 0);
        });
    });
});

describe('Token', () => {
    const createToken = token => new Token({ token, startCursor: 0, endCursor: 1 });

    describe('.isTokenRowDelimiter', () => {
        it('should return true if the token is a row delimiter', () => {
            assert.strictEqual(Token.isTokenRowDelimiter(createToken('\n'), createOptions()), true);
            assert.strictEqual(Token.isTokenRowDelimiter(createToken('\r'), createOptions()), true);
            assert.strictEqual(Token.isTokenRowDelimiter(createToken('\r\n'), createOptions()), true);
        });
        it('should return false if the token is not a row delimiter', () => {
            assert.strictEqual(Token.isTokenRowDelimiter(createToken('\\n'), createOptions()), false);
            assert.strictEqual(Token.isTokenRowDelimiter(createToken('\\r'), createOptions()), false);
        });
        it('should return false if the token is null or undefined', () => {
            assert.strictEqual(Token.isTokenRowDelimiter(null, createOptions()), false);
            assert.strictEqual(Token.isTokenRowDelimiter(undefined, createOptions()), false);
        });
    });

    describe('#isTokenCarriageReturn', () => {
        it('should return true if the token is a CR delimiter', () => {
            assert.strictEqual(Token.isTokenCarriageReturn(createToken('\r'), createOptions()), true);
        });
        it('should return false if the token is not a CR delimiter', () => {
            assert.strictEqual(Token.isTokenCarriageReturn(createToken('\n'), createOptions()), false);
            assert.strictEqual(Token.isTokenCarriageReturn(createToken('\r\n'), createOptions()), false);
        });
        it('should return false if the token is null or undefined', () => {
            assert.strictEqual(Token.isTokenCarriageReturn(null, createOptions()), false);
            assert.strictEqual(Token.isTokenCarriageReturn(undefined, createOptions()), false);
        });
    });

    describe('#isTokenComment', () => {
        it('should return true if the token is a comment character', () => {
            assert.strictEqual(Token.isTokenComment(createToken('#'), createOptions({ comment: '#' })), true);
        });

        it('should return false if the token is not a comment character', () => {
            assert.strictEqual(Token.isTokenComment(createToken('+'), createOptions({ comment: '#' })), false);
        });

        it('should return false if the token is not a comments are not supported', () => {
            assert.strictEqual(Token.isTokenComment(createToken('#'), createOptions()), false);
        });

        it('should return false if the token is null or undefined', () => {
            assert.strictEqual(Token.isTokenComment(null, createOptions({ comment: '#' })), false);
            assert.strictEqual(Token.isTokenComment(undefined, createOptions({ comment: '#' })), false);
        });
    });

    describe('#isTokenEscapeCharacter', () => {
        it('should return true if the token is an escape character', () => {
            assert.strictEqual(Token.isTokenEscapeCharacter(createToken('\\'), createOptions({ escape: '\\' })), true);
        });

        it('should return false if the token is not a escape character', () => {
            assert.strictEqual(Token.isTokenEscapeCharacter(createToken('"'), createOptions({ escape: '\\' })), false);
        });

        it('should return false if the token is null or undefined', () => {
            assert.strictEqual(Token.isTokenEscapeCharacter(null, createOptions({ escape: '\\' })), false);
            assert.strictEqual(Token.isTokenEscapeCharacter(undefined, createOptions({ escape: '\\' })), false);
        });
    });

    describe('#isTokenQuote', () => {
        it('should return true if the token is an quote character', () => {
            assert.strictEqual(Token.isTokenEscapeCharacter(createToken('$'), createOptions({ quote: '$' })), true);
        });

        it('should return false if the token is not a quote character', () => {
            assert.strictEqual(Token.isTokenEscapeCharacter(createToken('"'), createOptions({ quote: '$' })), false);
        });

        it('should return false if the token is null or undefined', () => {
            assert.strictEqual(Token.isTokenEscapeCharacter(null, createOptions({ quote: '$' })), false);
            assert.strictEqual(Token.isTokenEscapeCharacter(undefined, createOptions({ quote: '$' })), false);
        });
    });

    describe('#isTokenDelimiter', () => {
        it('should return true if the token is an delimiter character', () => {
            assert.strictEqual(Token.isTokenDelimiter(createToken('\t'), createOptions({ delimiter: '\t' })), true);
        });

        it('should return false if the token is not a delimiter character', () => {
            assert.strictEqual(Token.isTokenDelimiter(createToken(','), createOptions({ delimiter: '\t' })), false);
        });

        it('should return false if the token is null or undefined', () => {
            assert.strictEqual(Token.isTokenDelimiter(null, createOptions({ delimiter: '\t' })), false);
            assert.strictEqual(Token.isTokenDelimiter(undefined, createOptions({ delimiter: '\t' })), false);
        });
    });
});
