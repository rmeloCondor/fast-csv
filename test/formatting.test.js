const assert = require('assert');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const csv = require('../index');

describe('fast-csv formatting', () => {
    class RecordingStream extends stream.Writable {
        constructor() {
            super({
                write: (data, enc, cb) => {
                    this.data.push(data.toString());
                    cb();
                },
            });
            this.data = [];
        }

        get dataString() {
            return this.data.join('');
        }
    }

    describe('.writeToStream', () => {
        it('should write an array of arrays', (next) => {
            const ws = new RecordingStream();
            csv.writeToStream(ws, [
                [ 'a', 'b' ],
                [ 'a1', 'b1' ],
                [ 'a2', 'b2' ],
            ], { headers: true })
                .on('error', next)
                .on('finish', () => {
                    assert.deepStrictEqual(ws.dataString, 'a,b\na1,b1\na2,b2');
                    next();
                });
        });

        it('should support transforming an array of arrays', (next) => {
            const ws = new RecordingStream();
            csv
                .writeToStream(ws, [
                    [ 'a', 'b' ],
                    [ 'a1', 'b1' ],
                    [ 'a2', 'b2' ],
                ], {
                    headers: true,
                    transform(row) {
                        return row.map(entry => entry.toUpperCase());
                    },
                })
                .on('error', next)
                .on('finish', () => {
                    assert.deepStrictEqual(ws.dataString, 'A,B\nA1,B1\nA2,B2');
                    next();
                });
        });

        it('should support transforming an array of multi-dimensional arrays', (next) => {
            const ws = new RecordingStream();
            csv.writeToStream(ws, [
                [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
            ], {
                headers: true,
                transform(row) {
                    return row.map(entry => [ entry[0], entry[1].toUpperCase() ]);
                },
            })
                .on('error', next)
                .on('finish', () => {
                    assert.deepStrictEqual(ws.dataString, 'a,b\nA1,B1\nA2,B2');
                    next();
                });
        });


        it('should write an array of objects', (next) => {
            const ws = new RecordingStream();
            csv.writeToStream(ws, [
                { a: 'a1', b: 'b1' },
                { a: 'a2', b: 'b2' },
            ], { headers: true })
                .on('error', next)
                .on('finish', () => {
                    assert.deepStrictEqual(ws.dataString, 'a,b\na1,b1\na2,b2');
                    next();
                });
        });

        it('should support transforming an array of objects', (next) => {
            const ws = new RecordingStream();
            csv
                .writeToStream(ws, [
                    { a: 'a1', b: 'b1' },
                    { a: 'a2', b: 'b2' },
                ], {
                    headers: true,
                    transform(row) {
                        return {
                            A: row.a,
                            B: row.b,
                        };
                    },
                })
                .on('error', next)
                .on('finish', () => {
                    assert.deepStrictEqual(ws.dataString, 'A,B\na1,b1\na2,b2');
                    next();
                });
        });

        describe('rowDelimiter option', () => {
            it('should support specifying an alternate row delimiter', (next) => {
                const ws = new RecordingStream();
                csv
                    .writeToStream(ws, [
                        { a: 'a1', b: 'b1' },
                        { a: 'a2', b: 'b2' },
                    ], { headers: true, rowDelimiter: '\r\n' })
                    .on('error', next)
                    .on('finish', () => {
                        assert.deepStrictEqual(ws.dataString, 'a,b\r\na1,b1\r\na2,b2');
                        next();
                    });
            });

            it('should escape values that contain the alternate row delimiter', (next) => {
                const ws = new RecordingStream();
                csv
                    .writeToStream(ws, [
                        { a: 'a\t1', b: 'b1' },
                        { a: 'a\t2', b: 'b2' },
                    ], { headers: true, rowDelimiter: '\t' })
                    .on('error', next)
                    .on('finish', () => {
                        assert.deepStrictEqual(ws.dataString, 'a,b\t"a\t1",b1\t"a\t2",b2');
                        next();
                    });
            });
        });

        describe('quoteColumns option', () => {
            describe('quote all columns and headers if quoteColumns is true and quoteHeaders is false', () => {
                it('should work with objects', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            { a: 'a1', b: 'b1' },
                            { a: 'a2', b: 'b2' },
                        ], { headers: true, quoteColumns: true })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a","b"\n"a1","b1"\n"a2","b2"');
                            next();
                        });
                });

                it('should work with arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ 'a', 'b' ],
                            [ 'a1', 'b1' ],
                            [ 'a2', 'b2' ],
                        ], { headers: true, quoteColumns: true })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a","b"\n"a1","b1"\n"a2","b2"');
                            next();
                        });
                });

                it('should work with multi-dimenional arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                            [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                        ], { headers: true, quoteColumns: true })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a","b"\n"a1","b1"\n"a2","b2"');
                            next();
                        });
                });
            });

            describe('quote headers if quoteHeaders is true and not columns is quoteColumns is undefined', () => {
                it('should work with objects', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            { a: 'a1', b: 'b1' },
                            { a: 'a2', b: 'b2' },
                        ], { headers: true, quoteHeaders: true })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a","b"\na1,b1\na2,b2');
                            next();
                        });
                });

                it('should work with arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ 'a', 'b' ],
                            [ 'a1', 'b1' ],
                            [ 'a2', 'b2' ],
                        ], { headers: true, quoteHeaders: true })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a","b"\na1,b1\na2,b2');
                            next();
                        });
                });

                it('should work with multi-dimensional arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                            [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                        ], { headers: true, quoteHeaders: true })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a","b"\na1,b1\na2,b2');
                            next();
                        });
                });
            });

            describe('quote columns if quoteColumns is true and not quote headers if quoteHeaders is false', () => {
                it('should work with objects', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            { a: 'a1', b: 'b1' },
                            { a: 'a2', b: 'b2' },
                        ], { headers: true, quoteColumns: true, quoteHeaders: false })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, 'a,b\n"a1","b1"\n"a2","b2"');
                            next();
                        });
                });

                it('should work with arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ 'a', 'b' ],
                            [ 'a1', 'b1' ],
                            [ 'a2', 'b2' ],
                        ], { headers: true, quoteColumns: true, quoteHeaders: false })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, 'a,b\n"a1","b1"\n"a2","b2"');
                            next();
                        });
                });

                it('should work with multi-dimensional arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                            [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                        ], { headers: true, quoteColumns: true, quoteHeaders: false })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, 'a,b\n"a1","b1"\n"a2","b2"');
                            next();
                        });
                });
            });

            describe('if quoteColumns object it should only quote the specified column and header', () => {
                it('should work with objects', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            { a: 'a1', b: 'b1' },
                            { a: 'a2', b: 'b2' },
                        ], { headers: true, quoteColumns: { a: true } })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a",b\n"a1",b1\n"a2",b2');
                            next();
                        });
                });

                it('should work with arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ 'a', 'b' ],
                            [ 'a1', 'b1' ],
                            [ 'a2', 'b2' ],
                        ], { headers: true, quoteColumns: { a: true } })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a",b\n"a1",b1\n"a2",b2');
                            next();
                        });
                });

                it('should work with multi dimensional arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                            [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                        ], { headers: true, quoteColumns: { a: true } })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a",b\n"a1",b1\n"a2",b2');
                            next();
                        });
                });
            });

            describe('if quoteColumns object and quoteHeaders is false it should only quote the specified column and not the header', () => {
                it('should work with objects', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            { a: 'a1', b: 'b1' },
                            { a: 'a2', b: 'b2' },
                        ], { headers: true, quoteColumns: { a: true }, quoteHeaders: false })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, 'a,b\n"a1",b1\n"a2",b2');
                            next();
                        });
                });

                it('should work with arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ 'a', 'b' ],
                            [ 'a1', 'b1' ],
                            [ 'a2', 'b2' ],
                        ], { headers: true, quoteColumns: { a: true }, quoteHeaders: false })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, 'a,b\n"a1",b1\n"a2",b2');
                            next();
                        });
                });

                it('should work with multi-dimensional arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                            [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                        ], { headers: true, quoteColumns: { a: true }, quoteHeaders: false })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, 'a,b\n"a1",b1\n"a2",b2');
                            next();
                        });
                });
            });

            describe('if quoteColumns is an array it should only quote the specified column index', () => {
                it('should work with objects', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            { a: 'a1', b: 'b1' },
                            { a: 'a2', b: 'b2' },
                        ], { headers: true, quoteColumns: [ true ] })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a",b\n"a1",b1\n"a2",b2');
                            next();
                        });
                });

                it('should work with arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ 'a', 'b' ],
                            [ 'a1', 'b1' ],
                            [ 'a2', 'b2' ],
                        ], { headers: true, quoteColumns: [ true ] })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a",b\n"a1",b1\n"a2",b2');
                            next();
                        });
                });

                it('should work with multi-dimensional arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                            [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                        ], { headers: true, quoteColumns: [ true ] })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a",b\n"a1",b1\n"a2",b2');
                            next();
                        });
                });
            });

            describe('if quoteColumns is false and quoteHeaders is an object it should only quote the specified header and not the column', () => {
                it('should work with object', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            { a: 'a1', b: 'b1' },
                            { a: 'a2', b: 'b2' },
                        ], { headers: true, quoteHeaders: { a: true }, quoteColumns: false })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a",b\na1,b1\na2,b2');
                            next();
                        });
                });

                it('should work with arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ 'a', 'b' ],
                            [ 'a1', 'b1' ],
                            [ 'a2', 'b2' ],
                        ], { headers: true, quoteHeaders: { a: true }, quoteColumns: false })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a",b\na1,b1\na2,b2');
                            next();
                        });
                });

                it('should work with multi-dimenional arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                            [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                        ], { headers: true, quoteHeaders: { a: true }, quoteColumns: false })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, '"a",b\na1,b1\na2,b2');
                            next();
                        });
                });
            });

            describe('if quoteColumns is an object and quoteHeaders is an object it should only quote the specified header and column', () => {
                it('should work with objects', (next) => {
                    const ws = new RecordingStream();
                    csv.writeToStream(ws, [
                        { a: 'a1', b: 'b1' },
                        { a: 'a2', b: 'b2' },
                    ], { headers: true, quoteHeaders: { b: true }, quoteColumns: { a: true } })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, 'a,"b"\n"a1",b1\n"a2",b2');
                            next();
                        });
                });

                it('should work with arrays', (next) => {
                    const ws = new RecordingStream();
                    csv.writeToStream(ws, [
                        [ 'a', 'b' ],
                        [ 'a1', 'b1' ],
                        [ 'a2', 'b2' ],
                    ], { headers: true, quoteHeaders: { b: true }, quoteColumns: { a: true } })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, 'a,"b"\n"a1",b1\n"a2",b2');
                            next();
                        });
                });

                it('should work with multi-dimensional arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                            [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                        ], { headers: true, quoteHeaders: { b: true }, quoteColumns: { a: true } })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, 'a,"b"\n"a1",b1\n"a2",b2');
                            next();
                        });
                });
            });

            describe('if quoteHeaders is an array and quoteColumns is an false it should only quote the specified header and not the column', () => {
                it('should work with objects', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            { a: 'a1', b: 'b1' },
                            { a: 'a2', b: 'b2' },
                        ], { headers: true, quoteHeaders: [ false, true ], quoteColumns: false })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, 'a,"b"\na1,b1\na2,b2');
                            next();
                        });
                });

                it('should work with arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ 'a', 'b' ],
                            [ 'a1', 'b1' ],
                            [ 'a2', 'b2' ],
                        ], { headers: true, quoteHeaders: [ false, true ], quoteColumns: false })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, 'a,"b"\na1,b1\na2,b2');
                            next();
                        });
                });

                it('should work with arrays of multi-dimensional arrays', (next) => {
                    const ws = new RecordingStream();
                    csv
                        .writeToStream(ws, [
                            [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                            [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                        ], { headers: true, quoteHeaders: [ false, true ], quoteColumns: false })
                        .on('error', next)
                        .on('finish', () => {
                            assert.deepStrictEqual(ws.dataString, 'a,"b"\na1,b1\na2,b2');
                            next();
                        });
                });
            });
        });

        it('should add a final rowDelimiter if includeEndRowDelimiter is true', (next) => {
            const ws = new RecordingStream();
            csv.writeToStream(ws, [
                { a: 'a1', b: 'b1' },
                { a: 'a2', b: 'b2' },
            ], { headers: true, includeEndRowDelimiter: true })
                .on('error', next)
                .on('finish', () => {
                    assert.deepStrictEqual(ws.dataString, 'a,b\na1,b1\na2,b2\n');
                    next();
                });
        });
    });

    describe('.writeToString', () => {
        it('should write an array of arrays', (next) => {
            csv.writeToString([
                [ 'a', 'b' ],
                [ 'a1', 'b1' ],
                [ 'a2', 'b2' ],
            ], { headers: true }, (err, parsedCsv) => {
                if (err) {
                    next(err);
                } else {
                    assert.strictEqual(parsedCsv, 'a,b\na1,b1\na2,b2');
                    next();
                }
            });
        });

        it('should support transforming an array of arrays', (next) => {
            csv.writeToString([
                [ 'a', 'b' ],
                [ 'a1', 'b1' ],
                [ 'a2', 'b2' ],
            ], {
                headers: true,
                transform(row) {
                    return row.map(entry => entry.toUpperCase());
                },
            }, (err, parsedCsv) => {
                if (err) {
                    next(err);
                } else {
                    assert.strictEqual(parsedCsv, 'A,B\nA1,B1\nA2,B2');
                    next();
                }
            });
        });

        it('should write an array of multi-dimensional arrays', (next) => {
            csv.writeToString([
                [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
            ], { headers: true }, (err, parsedCsv) => {
                if (err) {
                    next(err);
                } else {
                    assert.strictEqual(parsedCsv, 'a,b\na1,b1\na2,b2');
                    next();
                }
            });
        });

        it('should support transforming an array of multi-dimensional arrays', (next) => {
            csv.writeToString([
                [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
            ], {
                headers: true,
                transform(row) {
                    return row.map(col => [ col[0], col[1].toUpperCase() ]);
                },
            }, (err, parsedCsv) => {
                if (err) {
                    next(err);
                } else {
                    assert.strictEqual(parsedCsv, 'a,b\nA1,B1\nA2,B2');
                    next();
                }
            });
        });


        it('should write an array of objects', (next) => {
            csv.writeToString([
                { a: 'a1', b: 'b1' },
                { a: 'a2', b: 'b2' },
            ], {
                headers: true,
                transform(row) {
                    return {
                        A: row.a,
                        B: row.b,
                    };
                },
            }, (err, parsedCsv) => {
                if (err) {
                    next(err);
                } else {
                    assert.strictEqual(parsedCsv, 'A,B\na1,b1\na2,b2');
                    next();
                }
            });
        });

        describe('header option', () => {
            it('should write an array of objects without headers', (next) => {
                csv.writeToString([
                    { a: 'a1', b: 'b1' },
                    { a: 'a2', b: 'b2' },
                ], {
                    headers: false,
                }, (err, parsedCsv) => {
                    if (err) {
                        next(err);
                    } else {
                        assert.strictEqual(parsedCsv, 'a1,b1\na2,b2');
                        next();
                    }
                });
            });

            it('should write an array of objects with headers', (next) => {
                csv.writeToString([
                    { a: 'a1', b: 'b1' },
                    { a: 'a2', b: 'b2' },
                ], {
                    headers: true,
                }, (err, parsedCsv) => {
                    if (err) {
                        next(err);
                    } else {
                        assert.strictEqual(parsedCsv, 'a,b\na1,b1\na2,b2');
                        next();
                    }
                });
            });

            it('should write an array of arrays without headers', (next) => {
                csv.writeToString([
                    [ 'a1', 'b1' ],
                    [ 'a2', 'b2' ],
                ], {
                    headers: false,
                }, (err, parsedCsv) => {
                    if (err) {
                        next(err);
                    } else {
                        assert.strictEqual(parsedCsv, 'a1,b1\na2,b2');
                        next();
                    }
                });
            });

            it('should write an array of arrays with headers', (next) => {
                csv.writeToString([
                    [ 'a', 'b' ],
                    [ 'a1', 'b1' ],
                    [ 'a2', 'b2' ],
                ], {
                    headers: true,
                }, (err, parsedCsv) => {
                    if (err) {
                        next(err);
                    } else {
                        assert.strictEqual(parsedCsv, 'a,b\na1,b1\na2,b2');
                        next();
                    }
                });
            });

            it('should write an array of multi-dimensional arrays without headers', (next) => {
                csv.writeToString([
                    [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                    [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                ], {
                    headers: false,
                }, (err, parsedCsv) => {
                    if (err) {
                        next(err);
                    } else {
                        assert.strictEqual(parsedCsv, 'a1,b1\na2,b2');
                        next();
                    }
                });
            });

            it('should write an array of multi-dimensional arrays with headers', (next) => {
                csv.writeToString([
                    [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                    [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                ], {
                    headers: true,
                }, (err, parsedCsv) => {
                    if (err) {
                        next(err);
                    } else {
                        assert.strictEqual(parsedCsv, 'a,b\na1,b1\na2,b2');
                        next();
                    }
                });
            });
        });


        describe('rowDelimiter option', () => {
            it('should support specifying an alternate row delimiter', (next) => {
                csv.writeToString([
                    { a: 'a1', b: 'b1' },
                    { a: 'a2', b: 'b2' },
                ], {
                    headers: true,
                    rowDelimiter: '\r\n',
                }, (err, parsedCsv) => {
                    if (err) {
                        next(err);
                    } else {
                        assert.strictEqual(parsedCsv, 'a,b\r\na1,b1\r\na2,b2');
                        next();
                    }
                });
            });
            it('should escape values that contain the alternate row delimiter', (next) => {
                csv.writeToString([
                    { a: 'a\t1', b: 'b1' },
                    { a: 'a\t2', b: 'b2' },
                ], {
                    headers: true,
                    rowDelimiter: '\t',
                }, (err, parsedCsv) => {
                    if (err) {
                        next(err);
                    } else {
                        assert.strictEqual(parsedCsv, 'a,b\t"a\t1",b1\t"a\t2",b2');
                        next();
                    }
                });
            });
        });

        it('should add a final rowDelimiter if includeEndRowDelimiter is true', (next) => {
            csv.writeToString([
                { a: 'a1', b: 'b1' },
                { a: 'a2', b: 'b2' },
            ], {
                headers: true,
                includeEndRowDelimiter: true,
            }, (err, parsedCsv) => {
                if (err) {
                    next(err);
                } else {
                    assert.strictEqual(parsedCsv, 'a,b\na1,b1\na2,b2\n');
                    next();
                }
            });
        });
    });

    describe('.writeToBuffer', () => {
        it('should write an array of arrays', (next) => {
            csv.writeToBuffer([
                [ 'a', 'b' ],
                [ 'a1', 'b1' ],
                [ 'a2', 'b2' ],
            ], { headers: true }, (err, parsedCsv) => {
                if (err) {
                    next(err);
                } else {
                    assert(parsedCsv instanceof Buffer);
                    assert.strictEqual(parsedCsv.toString(), 'a,b\na1,b1\na2,b2');
                    next();
                }
            });
        });

        it('should support transforming an array of arrays', (next) => {
            csv.writeToBuffer([
                [ 'a', 'b' ],
                [ 'a1', 'b1' ],
                [ 'a2', 'b2' ],
            ], {
                headers: true,
                transform(row) {
                    return row.map(entry => entry.toUpperCase());
                },
            }, (err, parsedCsv) => {
                if (err) {
                    next(err);
                } else {
                    assert(parsedCsv instanceof Buffer);
                    assert.strictEqual(parsedCsv.toString(), 'A,B\nA1,B1\nA2,B2');
                    next();
                }
            });
        });

        it('should write an array of multi-dimensional arrays', (next) => {
            csv.writeToBuffer([
                [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
            ], { headers: true }, (err, parsedCsv) => {
                if (err) {
                    next(err);
                } else {
                    assert(parsedCsv instanceof Buffer);
                    assert.strictEqual(parsedCsv.toString(), 'a,b\na1,b1\na2,b2');
                    next();
                }
            });
        });

        it('should support transforming an array of multi-dimensional arrays', (next) => {
            csv.writeToBuffer([
                [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
            ], {
                headers: true,
                transform(row) {
                    return row.map(col => [ col[0], col[1].toUpperCase() ]);
                },
            }, (err, parsedCsv) => {
                if (err) {
                    next(err);
                } else {
                    assert(parsedCsv instanceof Buffer);
                    assert.strictEqual(parsedCsv.toString(), 'a,b\nA1,B1\nA2,B2');
                    next();
                }
            });
        });


        it('should write an array of objects', (next) => {
            csv.writeToBuffer([
                { a: 'a1', b: 'b1' },
                { a: 'a2', b: 'b2' },
            ], {
                headers: true,
                transform(row) {
                    return {
                        A: row.a,
                        B: row.b,
                    };
                },
            }, (err, parsedCsv) => {
                if (err) {
                    next(err);
                } else {
                    assert(parsedCsv instanceof Buffer);
                    assert.strictEqual(parsedCsv.toString(), 'A,B\na1,b1\na2,b2');
                    next();
                }
            });
        });

        describe('rowDelimiter option', () => {
            it('should support specifying an alternate row delimiter', (next) => {
                csv.writeToBuffer([
                    { a: 'a1', b: 'b1' },
                    { a: 'a2', b: 'b2' },
                ], {
                    headers: true,
                    rowDelimiter: '\r\n',
                }, (err, parsedCsv) => {
                    if (err) {
                        next(err);
                    } else {
                        assert(parsedCsv instanceof Buffer);
                        assert.strictEqual(parsedCsv.toString(), 'a,b\r\na1,b1\r\na2,b2');
                        next();
                    }
                });
            });
            it('should escape values that contain the alternate row delimiter', (next) => {
                csv.writeToBuffer([
                    { a: 'a\t1', b: 'b1' },
                    { a: 'a\t2', b: 'b2' },
                ], {
                    headers: true,
                    rowDelimiter: '\t',
                }, (err, parsedCsv) => {
                    if (err) {
                        next(err);
                    } else {
                        assert(parsedCsv instanceof Buffer);
                        assert.strictEqual(parsedCsv.toString(), 'a,b\t"a\t1",b1\t"a\t2",b2');
                        next();
                    }
                });
            });
        });

        it('should add a final rowDelimiter if includeEndRowDelimiter is true', (next) => {
            csv.writeToBuffer([
                { a: 'a1', b: 'b1' },
                { a: 'a2', b: 'b2' },
            ], {
                headers: true,
                includeEndRowDelimiter: true,
            }, (err, parsedCsv) => {
                if (err) {
                    next(err);
                } else {
                    assert(parsedCsv instanceof Buffer);
                    assert.strictEqual(parsedCsv.toString(), 'a,b\na1,b1\na2,b2\n');
                    next();
                }
            });
        });
    });

    describe('.write', () => {
        it('should write an array of arrays', (next) => {
            const ws = new RecordingStream();
            csv
                .write([
                    [ 'a', 'b' ],
                    [ 'a1', 'b1' ],
                    [ 'a2', 'b2' ],
                ], { headers: true })
                .on('error', next)
                .pipe(ws)
                .on('finish', () => {
                    assert.deepStrictEqual(ws.dataString, 'a,b\na1,b1\na2,b2');
                    next();
                });
        });

        it('should support transforming an array of arrays', (next) => {
            const ws = new RecordingStream();
            const data = [
                [ 'a', 'b' ],
                [ 'a1', 'b1' ],
                [ 'a2', 'b2' ],
            ];
            csv
                .write(data, {
                    headers: true,
                    transform(row) {
                        return row.map(entry => entry.toUpperCase());
                    },
                })
                .on('error', next)
                .pipe(ws)
                .on('finish', () => {
                    assert.deepStrictEqual(ws.dataString, 'A,B\nA1,B1\nA2,B2');
                    next();
                });
        });

        it('should write an array of multi-dimensional arrays', (next) => {
            const ws = new RecordingStream();
            csv
                .write([
                    [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                    [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                ], { headers: true })
                .on('error', next)
                .pipe(ws)
                .on('finish', () => {
                    assert.deepStrictEqual(ws.dataString, 'a,b\na1,b1\na2,b2');
                    next();
                });
        });

        it('should support transforming an array of multi-dimensional arrays', (next) => {
            const ws = new RecordingStream();
            csv
                .write([
                    [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                    [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                ], {
                    headers: true,
                    transform(row) {
                        return row.map(col => [ col[0], col[1].toUpperCase() ]);
                    },
                })
                .on('error', next)
                .pipe(ws)
                .on('finish', () => {
                    assert.deepStrictEqual(ws.dataString, 'a,b\nA1,B1\nA2,B2');
                    next();
                });
        });

        it('should write an array of objects', (next) => {
            const ws = new RecordingStream();
            csv
                .write([
                    { a: 'a1', b: 'b1' },
                    { a: 'a2', b: 'b2' },
                ], { headers: true })
                .on('error', next)
                .pipe(ws)
                .on('finish', () => {
                    assert.deepStrictEqual(ws.dataString, 'a,b\na1,b1\na2,b2');
                    next();
                });
        });

        it('should support transforming an array of objects', (next) => {
            const ws = new RecordingStream();
            const data = [
                { a: 'a1', b: 'b1' },
                { a: 'a2', b: 'b2' },
            ];
            csv
                .write(data, {
                    headers: true,
                    transform(row) {
                        return {
                            A: row.a,
                            B: row.b,
                        };
                    },
                })
                .on('error', next)
                .pipe(ws)
                .on('finish', () => {
                    assert.deepStrictEqual(ws.dataString, 'A,B\na1,b1\na2,b2');
                    next();
                });
        });

        describe('rowDelimiter option', () => {
            it('should support specifying an alternate row delimiter', (next) => {
                const ws = new RecordingStream();
                csv
                    .write([
                        { a: 'a1', b: 'b1' },
                        { a: 'a2', b: 'b2' },
                    ], { headers: true, rowDelimiter: '\r\n' })
                    .on('error', next)
                    .pipe(ws)
                    .on('finish', () => {
                        assert.deepStrictEqual(ws.dataString, 'a,b\r\na1,b1\r\na2,b2');
                        next();
                    });
            });

            it('should escape values that contain the alternate row delimiter', (next) => {
                const ws = new RecordingStream();
                csv
                    .write([
                        { a: 'a\t1', b: 'b1' },
                        { a: 'a\t2', b: 'b2' },
                    ], { headers: true, rowDelimiter: '\t' })
                    .on('error', next)
                    .pipe(ws)
                    .on('finish', () => {
                        assert.deepStrictEqual(ws.dataString, 'a,b\t"a\t1",b1\t"a\t2",b2');
                        next();
                    });
            });
        });

        it('should add a final rowDelimiter if includeEndRowDelimiter is true', (next) => {
            const ws = new RecordingStream();
            csv
                .write([
                    { a: 'a1', b: 'b1' },
                    { a: 'a2', b: 'b2' },
                ], { headers: true, includeEndRowDelimiter: true })
                .on('error', next)
                .pipe(ws)
                .on('finish', () => {
                    assert.deepStrictEqual(ws.dataString, 'a,b\na1,b1\na2,b2\n');
                    next();
                });
        });
    });

    describe('.writeToPath', () => {
        it('should write an array of arrays', (next) => {
            csv
                .writeToPath(path.resolve(__dirname, 'assets/test.csv'), [
                    [ 'a', 'b' ],
                    [ 'a1', 'b1' ],
                    [ 'a2', 'b2' ],
                ], { headers: true })
                .on('error', next)
                .on('finish', () => {
                    assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\na1,b1\na2,b2');
                    fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                    next();
                });
        });

        it('should support transforming an array of arrays', (next) => {
            const data = [
                [ 'a', 'b' ],
                [ 'a1', 'b1' ],
                [ 'a2', 'b2' ],
            ];
            csv
                .writeToPath(path.resolve(__dirname, 'assets/test.csv'), data, {
                    headers: true,
                    transform(row) {
                        return row.map(entry => entry.toUpperCase());
                    },
                })
                .on('error', next)
                .on('finish', () => {
                    assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'A,B\nA1,B1\nA2,B2');
                    fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                    next();
                });
        });

        it('should transforming an array of multi-dimensional array', (next) => {
            csv
                .writeToPath(path.resolve(__dirname, 'assets/test.csv'), [
                    [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                    [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
                ], {
                    headers: true,
                    transform(row) {
                        return row.map(col => [ col[0], col[1].toUpperCase() ]);
                    },
                })
                .on('error', next)
                .on('finish', () => {
                    assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\nA1,B1\nA2,B2');
                    fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                    next();
                });
        });


        it('should write an array of objects', (next) => {
            csv
                .writeToPath(path.resolve(__dirname, 'assets/test.csv'), [
                    { a: 'a1', b: 'b1' },
                    { a: 'a2', b: 'b2' },
                ], { headers: true })
                .on('error', next)
                .on('finish', () => {
                    assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\na1,b1\na2,b2');
                    fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                    next();
                });
        });

        it('should support transforming an array of objects', (next) => {
            const data = [
                { a: 'a1', b: 'b1' },
                { a: 'a2', b: 'b2' },
            ];
            csv
                .writeToPath(path.resolve(__dirname, 'assets/test.csv'), data, {
                    headers: true,
                    transform(row) {
                        return {
                            A: row.a,
                            B: row.b,
                        };
                    },
                })
                .on('error', next)
                .on('finish', () => {
                    assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'A,B\na1,b1\na2,b2');
                    fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                    next();
                });
        });

        describe('rowDelimiter option', () => {
            it('should support specifying an alternate row delimiter', (next) => {
                csv
                    .writeToPath(path.resolve(__dirname, 'assets/test.csv'), [
                        { a: 'a1', b: 'b1' },
                        { a: 'a2', b: 'b2' },
                    ], { headers: true, rowDelimiter: '\r\n' })
                    .on('error', next)
                    .on('finish', () => {
                        assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\r\na1,b1\r\na2,b2');
                        fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                        next();
                    });
            });

            it('should escape values that contain the alternate row delimiter', (next) => {
                csv
                    .writeToPath(path.resolve(__dirname, 'assets/test.csv'), [
                        { a: 'a\t1', b: 'b1' },
                        { a: 'a\t2', b: 'b2' },
                    ], { headers: true, rowDelimiter: '\t' })
                    .on('error', next)
                    .on('finish', () => {
                        assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\t"a\t1",b1\t"a\t2",b2');
                        fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                        next();
                    });
            });
        });

        it('should add a final rowDelimiter if includeEndRowDelimiter is true', (next) => {
            csv
                .writeToPath(path.resolve(__dirname, 'assets/test.csv'), [
                    { a: 'a1', b: 'b1' },
                    { a: 'a2', b: 'b2' },
                ], { headers: true, includeEndRowDelimiter: true })
                .on('error', next)
                .on('finish', () => {
                    assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\na1,b1\na2,b2\n');
                    fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                    next();
                });
        });
    });

    describe('.createWriteStream', () => {
        it('should write an array of arrays', (next) => {
            const writable = fs.createWriteStream(path.resolve(__dirname, 'assets/test.csv'), { encoding: 'utf8' });
            const csvStream = csv
                .createWriteStream({ headers: true })
                .on('error', next);
            writable
                .on('finish', () => {
                    assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\na1,b1\na2,b2');
                    fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                    next();
                });
            csvStream.pipe(writable);
            const vals = [
                [ 'a', 'b' ],
                [ 'a1', 'b1' ],
                [ 'a2', 'b2' ],
            ];
            vals.forEach((item) => {
                csvStream.write(item);
            });
            csvStream.end();
        });


        it('should write an array of multidimesional arrays', (next) => {
            const writable = fs.createWriteStream(path.resolve(__dirname, 'assets/test.csv'), { encoding: 'utf8' });
            const csvStream = csv
                .createWriteStream({ headers: true })
                .on('error', next);
            writable
                .on('finish', () => {
                    assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\na1,b1\na2,b2');
                    fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                    next();
                });
            csvStream.pipe(writable);
            const vals = [
                [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
            ];
            vals.forEach((item) => {
                csvStream.write(item);
            });
            csvStream.end();
        });


        it('should transforming an array of multidimesional arrays', (next) => {
            const writable = fs.createWriteStream(path.resolve(__dirname, 'assets/test.csv'), { encoding: 'utf8' });
            const csvStream = csv
                .createWriteStream({ headers: true })
                .transform(row => row.map(col => [ col[0], col[1].toUpperCase() ]))
                .on('error', next);
            writable
                .on('finish', () => {
                    assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\nA1,B1\nA2,B2');
                    fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                    next();
                });
            csvStream.pipe(writable);
            const vals = [
                [ [ 'a', 'a1' ], [ 'b', 'b1' ] ],
                [ [ 'a', 'a2' ], [ 'b', 'b2' ] ],
            ];
            vals.forEach((item) => {
                csvStream.write(item);
            });
            csvStream.end();
        });

        it('should write an array of objects', (next) => {
            const writable = fs.createWriteStream(path.resolve(__dirname, 'assets/test.csv'), { encoding: 'utf8' });
            const csvStream = csv
                .createWriteStream({ headers: true })
                .on('error', next);
            writable
                .on('finish', () => {
                    assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\na1,b1\na2,b2');
                    fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                    next();
                });
            csvStream.pipe(writable);
            const vals = [
                { a: 'a1', b: 'b1' },
                { a: 'a2', b: 'b2' },
            ];
            vals.forEach((item) => {
                csvStream.write(item);
            });
            csvStream.end();
        });

        it('should should support transforming objects', (next) => {
            const writable = fs.createWriteStream(path.resolve(__dirname, 'assets/test.csv'), { encoding: 'utf8' });
            const csvStream = csv
                .createWriteStream({ headers: true })
                .transform(obj => ({ A: obj.a, B: obj.b }))
                .on('error', next);
            writable
                .on('finish', () => {
                    assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'A,B\na1,b1\na2,b2');
                    fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                    next();
                });
            csvStream.pipe(writable);
            const vals = [
                { a: 'a1', b: 'b1' },
                { a: 'a2', b: 'b2' },
            ];
            vals.forEach((item) => {
                csvStream.write(item);
            });
            csvStream.end();
        });

        describe('rowDelimiter option', () => {
            it('should support specifying an alternate row delimiter', (next) => {
                const writable = fs.createWriteStream(path.resolve(__dirname, 'assets/test.csv'), { encoding: 'utf8' });
                const csvStream = csv
                    .createWriteStream({ headers: true, rowDelimiter: '\r\n' })
                    .on('error', next);
                writable
                    .on('finish', () => {
                        assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\r\na1,b1\r\na2,b2');
                        fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                        next();
                    });
                csvStream.pipe(writable);
                const vals = [
                    { a: 'a1', b: 'b1' },
                    { a: 'a2', b: 'b2' },
                ];
                vals.forEach((item) => {
                    csvStream.write(item);
                });
                csvStream.end();
            });

            it('should escape values that contain the alternate row delimiter', (next) => {
                const writable = fs.createWriteStream(path.resolve(__dirname, 'assets/test.csv'), { encoding: 'utf8' });
                const csvStream = csv
                    .createWriteStream({ headers: true, rowDelimiter: '\t' })
                    .on('error', next);
                writable
                    .on('finish', () => {
                        assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\t"a\t1",b1\t"a\t2",b2');
                        fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                        next();
                    });
                csvStream.pipe(writable);
                const vals = [
                    { a: 'a\t1', b: 'b1' },
                    { a: 'a\t2', b: 'b2' },
                ];
                vals.forEach((item) => {
                    csvStream.write(item);
                });
                csvStream.end();
            });
        });

        it('should add a final rowDelimiter if includeEndRowDelimiter is true', (next) => {
            const writable = fs.createWriteStream(path.resolve(__dirname, 'assets/test.csv'), { encoding: 'utf8' });
            const csvStream = csv
                .createWriteStream({ headers: true, includeEndRowDelimiter: true })
                .on('error', next);
            writable
                .on('finish', () => {
                    assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\na1,b1\na2,b2\n');
                    fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                    next();
                });
            csvStream.pipe(writable);
            const vals = [
                { a: 'a1', b: 'b1' },
                { a: 'a2', b: 'b2' },
            ];
            vals.forEach((item) => {
                csvStream.write(item);
            });
            csvStream.end();
        });


        describe('piping from parser to formatter', () => {
            it('should allow piping from a parser to a formatter', (next) => {
                const writable = fs.createWriteStream(path.resolve(__dirname, 'assets/test.csv'), { encoding: 'utf8' });
                csv
                    .fromPath(path.resolve(__dirname, './assets/test22.csv'), { headers: true, objectMode: true })
                    .on('error', next)
                    .pipe(csv.createWriteStream({ headers: true }))
                    .on('error', next)
                    .pipe(writable)
                    .on('error', next);

                writable
                    .on('finish', () => {
                        assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\na1,b1\na2,b2');
                        fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                        next();
                    });
            });

            it('should preserve transforms', (next) => {
                const writable = fs.createWriteStream(path.resolve(__dirname, 'assets/test.csv'), { encoding: 'utf8' });
                csv
                    .fromPath(path.resolve(__dirname, './assets/test22.csv'), { headers: true })
                    .transform(obj => ({
                        ...obj,
                        ...{
                            a: `${obj.a}-parsed`,
                            b: `${obj.b}-parsed`,
                        },
                    }))
                    .on('error', next)
                    .pipe(csv.createWriteStream({ headers: true }))
                    .on('error', next)
                    .pipe(writable)
                    .on('error', next);

                writable
                    .on('finish', () => {
                        assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'a,b\na1-parsed,b1-parsed\na2-parsed,b2-parsed');
                        fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                        next();
                    });
            });
        });
    });
});
