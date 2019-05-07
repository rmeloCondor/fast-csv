const assert = require('assert');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const domain = require('domain');
const { Parser } = require('../lib/parser/parser');
const csv = require('../index');


describe('github issues', () => {
    describe('#68', () => {
        it('should handle bubble up parse errors properly', (next) => {
            const d = domain.create();
            let called = false;
            d.on('error', (err) => {
                d.exit();
                if (!called) {
                    called = true;
                    assert.strictEqual(/^Parse Error/.test(err.message), true);
                    next();
                }
            });
            d.run(() => csv
                .fromPath(path.resolve(__dirname, './assets/issue68-invalid.tsv'), { headers: true, delimiter: '\t' })
                .on('data', () => null)
                .on('end', (count) => {
                    assert.strictEqual(count, 20000);
                    throw new Error('End error');
                }));
        });

        it('should handle bubble up data errors properly', (next) => {
            const d = domain.create();
            let called = false;
            d.on('error', (err) => {
                d.exit();
                if (!called) {
                    called = true;
                    assert.strictEqual(err.message, 'Data error');
                    next();
                } else {
                    throw err;
                }
            });
            d.run(() => {
                let count = 0;
                csv
                    .fromPath(path.resolve(__dirname, './assets/issue68.tsv'), { headers: true, delimiter: '\t' })
                    .on('data', () => {
                        count += 1;
                        if ((count % 1001) === 0) {
                            throw new Error('Data error');
                        }
                    });
            });
        });
    });

    describe('#77', () => {
        it('should sort columns by order of headers defined', (next) => {
            const writable = fs.createWriteStream(path.resolve(__dirname, 'assets/test.csv'), { encoding: 'utf8' });
            const csvStream = csv.createWriteStream({ headers: [ 'second', 'first' ] })
                .on('error', next);

            writable.on('finish', () => {
                assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'second,first\n2,1');
                fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                next();
            });

            csvStream.pipe(writable);

            [ { first: '1', second: '2' } ].forEach(item => csvStream.write(item));

            csvStream.end();
        });

        it('should write headers even with no data', (next) => {
            const writable = fs.createWriteStream(path.resolve(__dirname, 'assets/test.csv'), { encoding: 'utf8' });
            const csvStream = csv.createWriteStream({ headers: [ 'first', 'second' ] })
                .on('error', next);

            writable.on('finish', () => {
                assert.strictEqual(fs.readFileSync(path.resolve(__dirname, 'assets/test.csv')).toString(), 'first,second\n,');
                fs.unlinkSync(path.resolve(__dirname, 'assets/test.csv'));
                next();
            });

            csvStream.pipe(writable);

            [ {} ].forEach(item => csvStream.write(item));

            csvStream.end();
        });
    });

    describe('#87', () => {
        class MyStream extends stream.Transform {
            constructor() {
                super({
                    objectMode: true,
                    highWaterMark: 16,
                    transform: (...args) => this.transform(...args),
                    flush: done => done(),
                });
                this.rowCount = 0;
            }

            transform(data, encoding, done) {
                this.rowCount += 1;
                if (this.rowCount % 2 === 0) {
                    setTimeout(() => done(), 10);
                } else {
                    done();
                }
            }
        }

        it('should not emit end until data is flushed from source', (next) => {
            const myStream = new MyStream();

            fs
                .createReadStream(path.resolve(__dirname, './assets/issue87.csv'))
                .pipe(csv({ headers: true }))
                .on('error', next)
                .pipe(myStream)
                .on('error', next)
                .on('finish', () => {
                    assert.strictEqual(myStream.rowCount, 99);
                    next();
                });
        });
    });

    describe('#93', () => it('should handle bubble up errors thrown in end properly', (next) => {
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
        d.run(() => csv
            .fromPath(path.resolve(__dirname, './assets/issue93.csv'), { headers: true, delimiter: '\t' })
            .on('error', () => next(new Error('Should not get here!')))
            .on('data', () => {
            })
            .on('end', () => {
                throw new Error('End error');
            }));
    }));

    describe('#111', () => {
        it('should parse a block of CSV text with a trailing delimiter', () => {
            const data = 'first_name,last_name,email_address,empty\nFirst1,Last1,email1@email.com,\n';
            const myParser = new Parser({ delimiter: ',' });
            assert.deepStrictEqual(myParser.parse(data, false), {
                line: '',
                rows: [
                    [ 'first_name', 'last_name', 'email_address', 'empty' ],
                    [ 'First1', 'Last1', 'email1@email.com', '' ],
                ],
            });
        });

        it('should parse a block of CSV text with a delimiter at file end', () => {
            const data = 'first_name,last_name,email_address,empty\nFirst1,Last1,email1@email.com,';
            const myParser = new Parser({ delimiter: ',' });
            assert.deepStrictEqual(myParser.parse(data, false), {
                line: '',
                rows: [
                    [ 'first_name', 'last_name', 'email_address', 'empty' ],
                    [ 'First1', 'Last1', 'email1@email.com', '' ],
                ],
            });
        });

        it('should parse a block of CSV text with two delimiters at file end', () => {
            const data = 'first_name,last_name,email_address,empty1,empty2\nFirst1,Last1,email1@email.com,,';
            const myParser = new Parser({ delimiter: ',' });
            assert.deepStrictEqual(myParser.parse(data, false), {
                line: '',
                rows: [
                    [ 'first_name', 'last_name', 'email_address', 'empty1', 'empty2' ],
                    [ 'First1', 'Last1', 'email1@email.com', '', '' ],
                ],
            });
        });

        it('should parse a block of CSV text with a trailing delimiter followed by a space', () => {
            const data = 'first_name,last_name,email_address,empty\nFirst1,Last1,email1@email.com, \n';
            const myParser = new Parser({ delimiter: ',' });
            assert.deepStrictEqual(myParser.parse(data, false), {
                line: '',
                rows: [
                    [ 'first_name', 'last_name', 'email_address', 'empty' ],
                    [ 'First1', 'Last1', 'email1@email.com', ' ' ],
                ],
            });
        });

        it('should parse a block of Space Separated Value text with a trailing delimiter', () => {
            const data = 'first_name last_name email_address empty\nFirst1 Last1 email1@email.com \n';
            const myParser = new Parser({ delimiter: ' ' });
            assert.deepStrictEqual(myParser.parse(data, false), {
                line: '',
                rows: [
                    [ 'first_name', 'last_name', 'email_address', 'empty' ],
                    [ 'First1', 'Last1', 'email1@email.com', '' ],
                ],
            });
        });

        it('should parse a block of Space Separated Values with two delimiters at file end', () => {
            const data = 'first_name last_name email_address empty empty2\nFirst1 Last1 email1@email.com  \n';
            const myParser = new Parser({ delimiter: ' ' });
            assert.deepStrictEqual(myParser.parse(data, false), {
                line: '',
                rows: [
                    [ 'first_name', 'last_name', 'email_address', 'empty', 'empty2' ],
                    [ 'First1', 'Last1', 'email1@email.com', '', '' ],
                ],
            });
        });
    });

    describe('#150', () => it('should not parse a row if a new line is ambiguous and there is more data', () => {
        const data = 'first_name,last_name,email_address\r';
        const myParser = new Parser({ delimiter: ',' });
        const parsedData = myParser.parse(data, true);
        assert.deepStrictEqual(parsedData, {
            line: 'first_name,last_name,email_address\r',
            rows: [],
        });
    }));

    describe('#158', () => {
        class Place {
            constructor(id, name) {
                this.id = id;
                this.name = name;
                this.calculatedValue = 0;
            }

            calculateSomething() {
                this.calculatedValue = this.id * 2;
                return this;
            }
        }


        it('should not write prototype methods in csv', (next) => {
            const written = [];
            const ws = new stream.Writable({
                write(data, enc, cb) {
                    written.push(`${data}`);
                    cb();
                },
            });
            ws.on('finish', () => {
                assert.deepStrictEqual(written.join(''), 'id,name,calculatedValue\n1,a,2\n2,b,4\n3,c,6');
                next();
            });
            csv.writeToStream(ws, [
                new Place(1, 'a').calculateSomething(),
                new Place(2, 'b').calculateSomething(),
                new Place(3, 'c').calculateSomething(),
            ], { headers: true }).on('error', next);
        });
    });

    describe('#131', () => it('should parse a csv with a UTF-8 Byte Order Mark', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, './assets/test28.csv'), { headers: true })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual[0].first_name, 'First1');
                assert.strictEqual(count, actual.length);
                next();
            });
    }));
});
