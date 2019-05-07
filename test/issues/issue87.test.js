const assert = require('assert');
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const csv = require('../../index');


describe('Issue #87 - https://github.com/C2FO/fast-csv/issues/87', () => {
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
