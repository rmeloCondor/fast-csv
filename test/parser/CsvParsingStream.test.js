/* eslint-disable no-cond-assign */
const assert = require('assert');
const _ = require('lodash');
const fs = require('fs');
const domain = require('domain');
const csv = require('../../lib');
const assets = require('./assets');

describe('CsvParserStream', () => {
    const listenForError = (stream, message, next) => {
        let called = false;
        stream
            .on('error', (err) => {
                assert.strictEqual(err.message, message);
                if (!called) {
                    called = true;
                    next();
                }
            })
            .on('end', () => next(new Error(`Expected and error to occur [expectedMessage=${message}]`)));
    };

    const collectData = stream => new Promise((res, rej) => {
        const rows = [];
        const invalidRows = [];
        stream
            .on('data', row => rows.push(row))
            .on('data-invalid', row => invalidRows.push(row))
            .on('error', rej)
            .on('end', (count) => {
                res({ count, rows, invalidRows });
            });
    });

    const parseAndCollectWithStream = (fileToReadPath, parser) => new Promise((res, rej) => {
        const rows = [];
        const invalidRows = [];
        fs.createReadStream(fileToReadPath)
            .on('error', rej)
            .pipe(parser)
            .on('data', row => rows.push(row))
            .on('data-invalid', row => invalidRows.push(row))
            .on('error', rej)
            .on('end', (count) => {
                res({ count, rows, invalidRows });
            });
    });

    const parseAndCollect = (fileToReadPath, options = {}) => parseAndCollectWithStream(
        fileToReadPath,
        csv.parse(options)
    );

    it('should parse a csv without quotes or escapes', () => {
        assets.write(assets.withHeaders);
        return parseAndCollect(assets.withHeaders.path, { headers: true })
            .then(({ count, rows }) => {
                assert.deepStrictEqual(rows, assets.withHeaders.parsed);
                assert.strictEqual(count, rows.length);
            });
    });

    it('should emit a readable event ', (next) => {
        const actual = [];
        const stream = csv.fromPath(assets.withHeaders.path, { headers: true }).on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, assets.withHeaders.parsed);
                assert.strictEqual(count, actual.length);
                next();
            });
        let index = 0;
        stream.on('readable', () => {
            for (let data = stream.read(); data !== null; data = stream.read()) {
                actual[index] = data;
                index += 1;
            }
        });
    });

    it('should emit data as a buffer if objectMode is false', () => {
        assets.write(assets.withHeaders);
        const expected = assets.withHeaders.parsed.map(r => Buffer.from(JSON.stringify(r)));
        return parseAndCollect(assets.withHeaders.path, { headers: true, objectMode: false })
            .then(({ count, rows }) => {
                assert.deepStrictEqual(rows, expected);
                assert.strictEqual(count, rows.length);
            });
    });

    it('should emit data as an object if objectMode is true', () => {
        assets.write(assets.withHeaders);
        return parseAndCollect(assets.withHeaders.path, { headers: true, objectMode: true })
            .then(({ count, rows }) => {
                assert.deepStrictEqual(rows, assets.withHeaders.parsed);
                assert.strictEqual(count, rows.length);
            });
    });

    it('should emit data as an object if objectMode is not specified', () => {
        assets.write(assets.withHeaders);
        return parseAndCollect(assets.withHeaders.path, { headers: true })
            .then(({ count, rows }) => {
                assert.deepStrictEqual(rows, assets.withHeaders.parsed);
                assert.strictEqual(count, rows.length);
            });
    });

    it('should parse a csv with quotes', () => {
        assets.write(assets.withHeadersAndQuotes);
        return parseAndCollect(assets.withHeadersAndQuotes.path, { headers: true })
            .then(({ count, rows }) => {
                assert.deepStrictEqual(rows, assets.withHeadersAndQuotes.parsed);
                assert.strictEqual(count, rows.length);
            });
    });

    it('should parse a csv with without headers', () => {
        assets.write(assets.noHeadersAndQuotes);
        return parseAndCollect(assets.noHeadersAndQuotes.path).then(({ count, rows }) => {
            assert.deepStrictEqual(rows, assets.noHeadersAndQuotes.parsed);
            assert.strictEqual(count, rows.length);
        });
    });

    it("should parse a csv with ' escapes", () => {
        assets.write(assets.withHeadersAndAlternateQuote);
        return parseAndCollect(assets.withHeadersAndAlternateQuote.path, { headers: true, quote: "'" })
            .then(({ count, rows }) => {
                assert.deepStrictEqual(rows, assets.withHeadersAndAlternateQuote.parsed);
                assert.strictEqual(count, rows.length);
            });
    });

    it('should allow specifying of columns', () => {
        assets.write(assets.noHeadersAndQuotes);
        const expected = assets.noHeadersAndQuotes.parsed.map(r => ({
            first_name: r[0],
            last_name: r[1],
            email_address: r[2],
            address: r[3],
        }));
        return parseAndCollect(assets.noHeadersAndQuotes.path, {
            headers: [ 'first_name', 'last_name', 'email_address', 'address' ],
        })
            .then(({ count, rows }) => {
                assert.deepStrictEqual(rows, expected);
                assert.strictEqual(count, rows.length);
            });
    });

    it('should allow renaming columns', () => {
        assets.write(assets.withHeadersAndQuotes);
        const expected = assets.withHeadersAndQuotes.parsed.map(r => ({
            firstName: r.first_name,
            lastName: r.last_name,
            emailAddress: r.email_address,
            address: r.address,
        }));
        return parseAndCollect(assets.withHeadersAndQuotes.path, {
            headers: [ 'firstName', 'lastName', 'emailAddress', 'address' ],
            renameHeaders: true,
        })
            .then(({ count, rows }) => {
                assert.deepStrictEqual(rows, expected);
                assert.strictEqual(count, rows.length);
            });
    });

    it('should propagate an error when trying to rename headers without providing new ones', (next) => {
        assets.write(assets.withHeadersAndQuotes);
        const stream = csv
            .fromPath(assets.withHeadersAndQuotes.path, { renameHeaders: true })
            .on('data', () => null);
        listenForError(stream, 'Error renaming headers: new headers must be provided in an array', next);
    });

    it('should propagate an error when trying to rename headers without providing proper ones', (next) => {
        assets.write(assets.withHeadersAndQuotes);
        const stream = csv
            .fromPath(assets.withHeadersAndQuotes.path, { renameHeaders: true, headers: true })
            .on('data', () => null);
        listenForError(stream, 'Error renaming headers: new headers must be provided in an array', next);
    });

    it('should propagate an error header length does not match column length', (next) => {
        assets.write(assets.headerColumnMismatch);
        const stream = csv
            .fromPath(assets.headerColumnMismatch.path, { headers: true })
            .on('data', () => null);
        listenForError(stream, 'Unexpected Error: column header mismatch expected: 4 columns got: 5', next);
    });

    it('should discard extra columns that do not map to a header when discardUnmappedColumns is true', () => {
        assets.write(assets.headerColumnMismatch);
        return parseAndCollect(assets.headerColumnMismatch.path, { headers: true, discardUnmappedColumns: true })
            .then(({ count, rows }) => {
                assert.deepStrictEqual(rows, assets.headerColumnMismatch.parsed);
                assert.strictEqual(count, rows.length);
            });
    });

    it('should report missing columns that do not exist but have a header with strictColumnHandling option', () => {
        assets.write(assets.withHeadersAndMissingColumns);
        const expectedRows = assets.withHeadersAndMissingColumns.parsed.filter(r => r.address !== null);
        const expectedInvalidRows = assets.withHeadersAndMissingColumns.parsed
            .filter(r => r.address === null)
            .map(r => Object.values(r).filter(v => !!v));
        return parseAndCollect(assets.withHeadersAndMissingColumns.path, { headers: true, strictColumnHandling: true })
            .then(({ count, rows, invalidRows }) => {
                assert.deepStrictEqual(rows, expectedRows);
                assert.deepStrictEqual(invalidRows, expectedInvalidRows);
                assert.strictEqual(count, rows.length);
            });
    });


    it('should allow specifying of columns as a sparse array', () => {
        assets.write(assets.noHeadersAndQuotes);
        const expected = assets.noHeadersAndQuotes.parsed.map(r => ({
            first_name: r[0],
            email_address: r[2],
        }));
        return parseAndCollect(assets.noHeadersAndQuotes.path, { headers: [ 'first_name', undefined, 'email_address', undefined ] })
            .then(({ count, rows }) => {
                assert.deepStrictEqual(rows, expected);
                assert.strictEqual(count, rows.length);
            });
    });

    it('should handle a trailing comma', () => {
        assets.write(assets.trailingComma);
        return parseAndCollect(assets.trailingComma.path, { headers: true })
            .then(({ count, rows }) => {
                assert.deepStrictEqual(rows, assets.trailingComma.parsed);
                assert.strictEqual(count, rows.length);
            });
    });

    it('should skip valid, but empty rows when ignoreEmpty is true', () => {
        assets.write(assets.emptyRows);
        return parseAndCollect(assets.emptyRows.path, { headers: true, ignoreEmpty: true })
            .then(({ count, rows, invalidRows }) => {
                assert.strictEqual(count, 0);
                assert.deepStrictEqual(rows, []);
                assert.deepStrictEqual(invalidRows, []);
            });
    });

    describe('alternate delimiters', () => {
        [ '\t', '|', ';' ].forEach((delimiter) => {
            it(`should support '${delimiter.replace(/\t/, '\\t')}' delimiters`, () => {
                const { path: assetPath, content } = assets.withHeadersAlternateDelimiter;
                assets.write({
                    path: assetPath,
                    content: content(delimiter),
                });
                return parseAndCollect(assetPath, { headers: true, delimiter })
                    .then(({ count, rows }) => {
                        assert.deepStrictEqual(rows, assets.withHeadersAlternateDelimiter.parsed);
                        assert.strictEqual(count, rows.length);
                    });
            });
        });
    });

    it('should emit an error for malformed rows', (next) => {
        assets.write(assets.malformed);
        const stream = csv
            .fromPath(assets.malformed.path, { headers: true });
        listenForError(stream, "Parse Error: expected: ',' OR new line got: 'a'. at 'a   \", Las", next);
    });

    describe('#validate', () => {
        it('should allow validation of rows', () => {
            assets.write(assets.withHeaders);
            const validator = row => parseInt(row.first_name.replace(/^First/, ''), 10) % 2;
            const invalidValid = _.partition(assets.withHeaders.parsed, validator);
            const parser = csv.parse({ headers: true })
                .validate(validator);

            return parseAndCollectWithStream(assets.withHeaders.path, parser)
                .then(({ count, rows, invalidRows }) => {
                    assert.deepStrictEqual(invalidRows, invalidValid[1]);
                    assert.deepStrictEqual(rows, invalidValid[0]);
                    assert.strictEqual(count, invalidValid[0].length);
                });
        });

        it('should allow async validation of rows', () => {
            assets.write(assets.withHeaders);
            const validator = row => parseInt(row.first_name.replace(/^First/, ''), 10) % 2;
            const invalidValid = _.partition(assets.withHeaders.parsed, validator);
            const parser = csv.parse({ headers: true })
                .validate((row, next) => setImmediate(() => next(null, validator(row))));

            return parseAndCollectWithStream(assets.withHeaders.path, parser)
                .then(({ count, rows, invalidRows }) => {
                    assert.deepStrictEqual(invalidRows, invalidValid[1]);
                    assert.deepStrictEqual(rows, invalidValid[0]);
                    assert.strictEqual(count, invalidValid[0].length);
                });
        });

        it('should propagate errors from async validation', (next) => {
            assets.write(assets.withHeaders);
            let index = -1;
            const stream = csv
                .fromPath(assets.withHeaders.path, { headers: true })
                .validate((data, validateNext) => setImmediate(() => {
                    index += 1;
                    if (index === 8) {
                        validateNext(new Error('Validation ERROR!!!!'));
                    } else {
                        validateNext(null, true);
                    }
                }));
            listenForError(stream, 'Validation ERROR!!!!', next);
        });

        it('should propagate async errors at the beginning', (next) => {
            assets.write(assets.withHeaders);
            const stream = csv
                .fromPath(assets.withHeaders.path, { headers: true })
                .validate((data, validateNext) => validateNext(new Error('Validation ERROR!!!!')));
            listenForError(stream, 'Validation ERROR!!!!', next);
        });

        it('should propagate thrown errors', (next) => {
            assets.write(assets.withHeaders);
            let index = -1;
            const stream = csv
                .fromPath(assets.withHeaders.path, { headers: true })
                .validate((data, validateNext) => {
                    index += 1;
                    if (index === 8) {
                        throw new Error('Validation ERROR!!!!');
                    } else {
                        setImmediate(() => validateNext(null, true));
                    }
                });
            listenForError(stream, 'Validation ERROR!!!!', next);
        });

        it('should propagate thrown errors at the beginning', (next) => {
            assets.write(assets.withHeaders);
            const stream = csv
                .fromPath(assets.withHeaders.path, { headers: true })
                .validate(() => {
                    throw new Error('Validation ERROR!!!!');
                });
            listenForError(stream, 'Validation ERROR!!!!', next);
        });

        it('should throw an error if validate is not called with a function', () => {
            assert.throws(() => {
                csv({ headers: true }).validate('hello');
            }, /TypeError: The validate should be a function/);
        });
    });

    describe('#transform', () => {
        const transformer = row => ({
            firstName: row.first_name,
            lastName: row.last_name,
            emailAddress: row.email_address,
            address: row.address,
        });

        it('should allow transforming of data', () => {
            assets.write(assets.withHeaders);
            const expected = assets.withHeaders.parsed.map(transformer);
            const parser = csv.parse({ headers: true })
                .transform(transformer);
            return parseAndCollectWithStream(assets.withHeaders.path, parser).then(({ count, rows }) => {
                assert.deepStrictEqual(rows, expected);
                assert.strictEqual(count, expected.length);
            });
        });

        it('should async transformation of data', () => {
            assets.write(assets.withHeaders);
            const expected = assets.withHeaders.parsed.map(transformer);
            const parser = csv.parse({ headers: true })
                .transform((row, next) => setImmediate(() => next(null, transformer(row))));
            return parseAndCollectWithStream(assets.withHeaders.path, parser).then(({ count, rows }) => {
                assert.deepStrictEqual(rows, expected);
                assert.strictEqual(count, expected.length);
            });
        });

        it('should propogate errors when transformation of data', (next) => {
            assets.write(assets.withHeaders);
            let index = -1;
            const stream = csv
                .fromPath(assets.withHeaders.path, { headers: true })
                .transform((data, cb) => setImmediate(() => {
                    index += 1;
                    if (index === 8) {
                        cb(new Error('transformation ERROR!!!!'));
                    } else {
                        cb(null, transformer(data));
                    }
                }));
            listenForError(stream, 'transformation ERROR!!!!', next);
        });

        it('should propogate errors when transformation of data at the beginning', (next) => {
            assets.write(assets.withHeaders);
            const stream = csv
                .fromPath(assets.withHeaders.path, { headers: true })
                .transform((data, cb) => setImmediate(() => cb(new Error('transformation ERROR!!!!'))));
            listenForError(stream, 'transformation ERROR!!!!', next);
        });


        it('should propagate thrown errors at the end', (next) => {
            assets.write(assets.withHeaders);
            let index = -1;
            const stream = csv
                .fromPath(assets.withHeaders.path, { headers: true })
                .transform((data, cb) => {
                    index += 1;
                    if (index === 8) {
                        throw new Error('transformation ERROR!!!!');
                    } else {
                        setImmediate(() => cb(null, data));
                    }
                });
            listenForError(stream, 'transformation ERROR!!!!', next);
        });

        it('should propagate thrown errors at the beginning', (next) => {
            assets.write(assets.withHeaders);
            const stream = csv
                .fromPath(assets.withHeaders.path, { headers: true })
                .transform(() => {
                    throw new Error('transformation ERROR!!!!');
                });
            listenForError(stream, 'transformation ERROR!!!!', next);
        });

        it('should throw an error if a transform is not called with a function', () => {
            assert.throws(() => {
                csv({ headers: true }).transform('hello');
            }, /TypeError: The transform should be a function/);
        });
    });

    describe('pause/resume', () => {
        it('should support pausing a stream', () => {
            assets.write(assets.withHeaders);
            return new Promise((res, rej) => {
                const rows = [];
                let paused = false;
                const stream = csv.parse({ headers: true });
                fs.createReadStream(assets.withHeaders.path)
                    .on('error', rej)
                    .pipe(stream)
                    .on('data', (row) => {
                        assert(!paused);
                        rows.push(row);
                        paused = true;
                        stream.pause();
                        setTimeout(() => {
                            assert(paused);
                            paused = false;
                            stream.resume();
                        }, 100);
                    })
                    .on('error', rej)
                    .on('end', (count) => {
                        assert.deepStrictEqual(rows, assets.withHeaders.parsed);
                        assert.strictEqual(count, rows.length);
                        res();
                    });
            });
        });
    });

    it('should not catch errors thrown in end', (next) => {
        assets.write(assets.withHeaders);
        const d = domain.create();
        let called = false;
        d.on('error', (err) => {
            d.exit();
            if (called) {
                throw err;
            }
            called = true;
            assert.strictEqual(err.message, 'End error');
            next();
        });
        d.run(() => fs.createReadStream(assets.withHeaders.path)
            .on('error', next)
            .pipe(csv.parse({ headers: true }))
            .on('error', () => next(new Error('Should not get here!')))
            .on('data', () => {
            })
            .on('end', () => {
                throw new Error('End error');
            }));
    });


    describe('.fromStream', () => {
        it('should accept a stream', () => {
            assets.write(assets.withHeaders);
            const stream = csv.fromStream(fs.createReadStream(assets.withHeaders.path), { headers: true });
            return collectData(stream).then(({ count, rows }) => {
                assert.deepStrictEqual(rows, assets.withHeaders.parsed);
                assert.strictEqual(count, rows.length);
            });
        });
    });

    describe('.fromPath', () => {
        it('parse a csv from the given path', () => {
            assets.write(assets.withHeaders);
            const stream = csv.fromPath(assets.withHeaders.path, { headers: true });
            return collectData(stream).then(({ count, rows }) => {
                assert.deepStrictEqual(rows, assets.withHeaders.parsed);
                assert.strictEqual(count, rows.length);
            });
        });
    });

    describe('.fromString', () => {
        it('should accept a csv string', (next) => {
            const actual = [];
            csv
                .fromString(assets.withHeaders.content, { headers: true })
                .on('data', data => actual.push(data))
                .on('end', (count) => {
                    assert.deepStrictEqual(actual, assets.withHeaders.parsed);
                    assert.strictEqual(count, actual.length);
                    next();
                });
        });
        it('should throw an error if an invalid string is passed in', () => assert.throws(() => csv.fromString(1), /TypeError: CsvParserStream.fromString requires a string to parse got 1/));
    });
});
