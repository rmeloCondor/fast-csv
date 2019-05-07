const assert = require('assert');
const { EOL } = require('os');
const domain = require('domain');
const csv = require('../../index');


describe('Issue #93 - https://github.com/C2FO/fast-csv/issues/93', () => {
    const csvContent = [
        'a,b',
        'c,d',
        'e,f',
    ].join(EOL);

    it('should not catch errors thrown in end with headers enabled', (next) => {
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
            .fromString(csvContent, { headers: true, delimiter: '\t' })
            .on('error', () => next(new Error('Should not get here!')))
            .on('data', () => {
                /* do nothing */
            })
            .on('end', () => {
                throw new Error('End error');
            }));
    });

    it('should not catch errors thrown in end with headers disabled', (next) => {
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
            .fromString(csvContent, { headers: false })
            .on('error', () => next(new Error('Should not get here!')))
            .on('data', () => {
                /* do nothing */
            })
            .on('end', () => {
                throw new Error('End error');
            }));
    });
});
