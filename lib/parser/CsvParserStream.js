const { Transform, Readable } = require('stream');
const { StringDecoder } = require('string_decoder');
const fs = require('fs');
const _ = require('lodash');
const { Parser } = require('./parser');
const { HeaderTransformer, RowTransformerValidator } = require('./row');
const ParserOptions = require('./ParserOptions');

class CsvParserStream extends Transform {
    static fromStream(stream, options) {
        return stream.pipe(new CsvParserStream(new ParserOptions(options)));
    }

    static fromPath(location, options = {}) {
        return fs.createReadStream(location).pipe(new CsvParserStream(new ParserOptions(options)));
    }

    static fromString(string, options) {
        if (!_.isString(string)) {
            throw new TypeError(`CsvParserStream.fromString requires a string to parse got ${string}`);
        }
        const rs = new Readable();
        rs.push(string);
        rs.push(null);
        return rs.pipe(new CsvParserStream(new ParserOptions(options)));
    }


    constructor(parserOptions = ParserOptions.default) {
        if (!parserOptions || !(parserOptions instanceof ParserOptions)) {
            throw new TypeError('parserOptions is required');
        }
        super({ objectMode: parserOptions.objectMode });
        this.parserOptions = parserOptions;
        this.decoder = new StringDecoder();
        this.parser = new Parser(parserOptions);
        this.headerTransformer = new HeaderTransformer(parserOptions);
        this.rowTransformerValidator = new RowTransformerValidator();

        this.lines = '';
        this.rowCount = 0;
        this.__endEmitted = false;
    }

    transform(transformFunction) {
        this.rowTransformerValidator.rowTransform = transformFunction;
        return this;
    }

    validate(validateFunction) {
        this.rowTransformerValidator.rowValidator = validateFunction;
        return this;
    }

    emit(event, ...rest) {
        if (event === 'end') {
            if (!this.__endEmitted) {
                this.__endEmitted = true;
                super.emit('end', this.rowCount);
            }
            return;
        }
        super.emit(event, ...rest);
    }

    _transform(data, encoding, done) {
        try {
            const { lines } = this;
            const newLine = (lines + this.decoder.write(data));
            const rows = this._parse(newLine, true);
            this._processRows(rows, done);
        } catch (e) {
            done(e);
        }
    }


    _flush(done) {
        try {
            const rows = this._parse(this.lines, false);
            this._processRows(rows, done);
        } catch (e) {
            done(e);
        }
    }

    _parse(data, hasMoreData) {
        if (!data) {
            return [];
        }
        const { line, rows } = this.parser.parse(data, hasMoreData);
        this.lines = line;
        return rows;
    }

    _processRows(rows, cb) {
        const rowsLength = rows.length;
        const iterate = (i) => {
            if (i >= rowsLength) {
                return cb();
            }
            const row = rows[i];
            this.rowCount += 1;
            const nextRowCount = this.rowCount;
            return this.__transformRow(row, (err, transformResult) => {
                if (err) {
                    this.rowCount -= 1;
                    return cb(err);
                }
                if (!transformResult.isValid) {
                    this.rowCount -= 1;
                    this.emit('data-invalid', transformResult.row, nextRowCount, transformResult.reason);
                } else if (!transformResult.row) {
                    this.rowCount -= 1;
                } else if (!this.parserOptions.objectMode) {
                    this.push(JSON.stringify(transformResult.row));
                } else {
                    this.push(transformResult.row);
                }
                if ((i % 100) === 0) {
                    // incase the transform are sync insert a next tick to prevent stack overflow
                    return setImmediate(() => iterate(i + 1));
                }
                return iterate(i + 1);
            });
        };
        iterate(0);
    }

    __transformRow(parsedRow, cb) {
        try {
            this.headerTransformer.transform(parsedRow, (err, withHeaders) => {
                if (err) {
                    return cb(err);
                }
                if (!withHeaders.isValid) {
                    return cb(null, { isValid: false, reason: null, row: parsedRow });
                }
                if (withHeaders.row) {
                    return this.rowTransformerValidator.transformAndValidate(withHeaders.row, cb);
                }
                return cb(null, { row: null, isValid: true, reason: null });
            });
        } catch (e) {
            cb(e);
        }
    }
}

module.exports = CsvParserStream;
