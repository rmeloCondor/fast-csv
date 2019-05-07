/* eslint-disable no-cond-assign */
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const csv = require('../../lib');

function camelize(str) {
    return str.replace(/_(.)/g, (a, b) => b.toUpperCase());
}

const expected1 = [
    {
        first_name: 'First1',
        last_name: 'Last1',
        email_address: 'email1@email.com',
        address: '1 Street St, State ST, 88888',
    },
    {
        first_name: 'First2',
        last_name: 'Last2',
        email_address: 'email2@email.com',
        address: '2 Street St, State ST, 88888',
    },
    {
        first_name: 'First3',
        last_name: 'Last3',
        email_address: 'email3@email.com',
        address: '3 Street St, State ST, 88888',
    },
    {
        first_name: 'First4',
        last_name: 'Last4',
        email_address: 'email4@email.com',
        address: '4 Street St, State ST, 88888',
    },
    {
        first_name: 'First5',
        last_name: 'Last5',
        email_address: 'email5@email.com',
        address: '5 Street St, State ST, 88888',
    },
    {
        first_name: 'First6',
        last_name: 'Last6',
        email_address: 'email6@email.com',
        address: '6 Street St, State ST, 88888',
    },
    {
        first_name: 'First7',
        last_name: 'Last7',
        email_address: 'email7@email.com',
        address: '7 Street St, State ST, 88888',
    },
    {
        first_name: 'First8',
        last_name: 'Last8',
        email_address: 'email8@email.com',
        address: '8 Street St, State ST, 88888',
    },
    {
        first_name: 'First9',
        last_name: 'Last9',
        email_address: 'email9@email.com',
        address: '9 Street St, State ST, 88888',
    },
];

const expected1Sparse = [
    {
        first_name: 'First1',
        email_address: 'email1@email.com',
    },
    {
        first_name: 'First2',
        email_address: 'email2@email.com',
    },
    {
        first_name: 'First3',
        email_address: 'email3@email.com',
    },
    {
        first_name: 'First4',
        email_address: 'email4@email.com',
    },
    {
        first_name: 'First5',
        email_address: 'email5@email.com',
    },
    {
        first_name: 'First6',
        email_address: 'email6@email.com',
    },
    {
        first_name: 'First7',
        email_address: 'email7@email.com',
    },
    {
        first_name: 'First8',
        email_address: 'email8@email.com',
    },
    {
        first_name: 'First9',
        email_address: 'email9@email.com',
    },
];

const expected2 = [
    [ 'First1', 'Last1', 'email1@email.com', '1 Street St, State ST, 88888' ],
    [ 'First2', 'Last2', 'email2@email.com', '2 Street St, State ST, 88888' ],
    [ 'First3', 'Last3', 'email3@email.com', '3 Street St, State ST, 88888' ],
    [ 'First4', 'Last4', 'email4@email.com', '4 Street St, State ST, 88888' ],
    [ 'First5', 'Last5', 'email5@email.com', '5 Street St, State ST, 88888' ],
    [ 'First6', 'Last6', 'email6@email.com', '6 Street St, State ST, 88888' ],
    [ 'First7', 'Last7', 'email7@email.com', '7 Street St, State ST, 88888' ],
    [ 'First8', 'Last8', 'email8@email.com', '8 Street St, State ST, 88888' ],
    [ 'First9', 'Last9', 'email9@email.com', '9 Street St, State ST, 88888' ],
];

const expected3 = [
    {
        first_name: 'First1',
        last_name: 'Last1',
        email_address: 'email1@email.com',
        address: '1 "Street" St, State ST, 88888',
    },
    {
        first_name: 'First2',
        last_name: 'Last2',
        email_address: 'email2@email.com',
        address: '2 "Street" St, State ST, 88888',
    },
    {
        first_name: 'First3',
        last_name: 'Last3',
        email_address: 'email3@email.com',
        address: '3 "Street" St, State ST, 88888',
    },
    {
        first_name: 'First4',
        last_name: 'Last4',
        email_address: 'email4@email.com',
        address: '4 "Street" St, State ST, 88888',
    },
    {
        first_name: 'First5',
        last_name: 'Last5',
        email_address: 'email5@email.com',
        address: '5 "Street" St, State ST, 88888',
    },
    {
        first_name: 'First6',
        last_name: 'Last6',
        email_address: 'email6@email.com',
        address: '6 "Street" St, State ST, 88888',
    },
    {
        first_name: 'First7',
        last_name: 'Last7',
        email_address: 'email7@email.com',
        address: '7 "Street" St, State ST, 88888',
    },
    {
        first_name: 'First8',
        last_name: 'Last8',
        email_address: 'email8@email.com',
        address: '8 "Street" St, State ST, 88888',
    },
    {
        first_name: 'First9',
        last_name: 'Last9',
        email_address: 'email9@email.com',
        address: '9 "Street" St, State ST, 88888',
    },
];

const expected4 = [
    { first_name: 'First1', last_name: 'Last1', email_address: 'email1@email.com' },
    { first_name: 'First2', last_name: 'Last2', email_address: 'email2@email.com' },
    { first_name: 'First3', last_name: 'Last3', email_address: 'email3@email.com' },
    { first_name: 'First4', last_name: 'Last4', email_address: 'email4@email.com' },
    { first_name: 'First5', last_name: 'Last5', email_address: 'email5@email.com' },
    { first_name: 'First6', last_name: 'Last6', email_address: 'email6@email.com' },
    { first_name: 'First7', last_name: 'Last7', email_address: 'email7@email.com' },
    { first_name: 'First8', last_name: 'Last8', email_address: 'email8@email.com' },
    { first_name: 'First9', last_name: 'Last9', email_address: 'email9@email.com' },
];

const expectedValid = [
    { first_name: 'First1', last_name: 'Last1', email_address: 'email1@email.com' },
    { first_name: 'First3', last_name: 'Last3', email_address: 'email3@email.com' },
    { first_name: 'First5', last_name: 'Last5', email_address: 'email5@email.com' },
    { first_name: 'First7', last_name: 'Last7', email_address: 'email7@email.com' },
    { first_name: 'First9', last_name: 'Last9', email_address: 'email9@email.com' },
];

const expectedInvalid = [
    { first_name: 'First2', last_name: 'Last2', email_address: 'email2@email.com' },
    { first_name: 'First4', last_name: 'Last4', email_address: 'email4@email.com' },
    { first_name: 'First6', last_name: 'Last6', email_address: 'email6@email.com' },
    { first_name: 'First8', last_name: 'Last8', email_address: 'email8@email.com' },
];

const expectedCamelCase = [
    { firstName: 'First1', lastName: 'Last1', emailAddress: 'email1@email.com' },
    { firstName: 'First2', lastName: 'Last2', emailAddress: 'email2@email.com' },
    { firstName: 'First3', lastName: 'Last3', emailAddress: 'email3@email.com' },
    { firstName: 'First4', lastName: 'Last4', emailAddress: 'email4@email.com' },
    { firstName: 'First5', lastName: 'Last5', emailAddress: 'email5@email.com' },
    { firstName: 'First6', lastName: 'Last6', emailAddress: 'email6@email.com' },
    { firstName: 'First7', lastName: 'Last7', emailAddress: 'email7@email.com' },
    { firstName: 'First8', lastName: 'Last8', emailAddress: 'email8@email.com' },
    { firstName: 'First9', lastName: 'Last9', emailAddress: 'email9@email.com' },
];

const expected7 = [
    {
        first_name: 'First1', last_name: 'Last1', email_address: 'email1@email.com', address: '',
    },
    {
        first_name: 'First2', last_name: 'Last2', email_address: 'email2@email.com', address: '',
    },
    {
        first_name: 'First3', last_name: 'Last3', email_address: 'email3@email.com', address: '',
    },
    {
        first_name: 'First4', last_name: 'Last4', email_address: 'email4@email.com', address: '',
    },
    {
        first_name: 'First5', last_name: 'Last5', email_address: 'email5@email.com', address: '',
    },
    {
        first_name: 'First6', last_name: 'Last6', email_address: 'email6@email.com', address: '',
    },
    {
        first_name: 'First7', last_name: 'Last7', email_address: 'email7@email.com', address: '',
    },
    {
        first_name: 'First8', last_name: 'Last8', email_address: 'email8@email.com', address: '',
    },
    {
        first_name: 'First9', last_name: 'Last9', email_address: 'email9@email.com', address: '',
    },
];

const expected8 = [
    { first_name: 'First1', last_name: 'Last1', email_address: 'email1@email.com' },
    { first_name: '', last_name: 'Last4', email_address: 'email4@email.com' },
    { first_name: 'First5', last_name: '', email_address: 'email5@email.com' },
    { first_name: 'First7', last_name: 'Last7', email_address: '' },
];

const expected9 = [
    {
        first_name: "First'1",
        last_name: 'Last1',
        email_address: 'email1@email.com',
        address: '1 Street St, State ST, 88888',
    },
    {
        first_name: "First'2",
        last_name: 'Last2',
        email_address: 'email2@email.com',
        address: '2 Street St, State ST, 88888',
    },
    {
        first_name: "First'3",
        last_name: 'Last3',
        email_address: 'email3@email.com',
        address: '3 Street St, State ST, 88888',
    },
    {
        first_name: "First'4",
        last_name: 'Last4',
        email_address: 'email4@email.com',
        address: '4 Street St, State ST, 88888',
    },
    {
        first_name: "First'5",
        last_name: 'Last5',
        email_address: 'email5@email.com',
        address: '5 Street St, State ST, 88888',
    },
    {
        first_name: "First'6",
        last_name: 'Last6',
        email_address: 'email6@email.com',
        address: '6 Street St, State ST, 88888',
    },
    {
        first_name: "First'7",
        last_name: 'Last7',
        email_address: 'email7@email.com',
        address: '7 Street St, State ST, 88888',
    },
    {
        first_name: "First'8",
        last_name: 'Last8',
        email_address: 'email8@email.com',
        address: '8 Street St, State ST, 88888',
    },
    {
        first_name: "First'9",
        last_name: 'Last9',
        email_address: 'email9@email.com',
        address: '9 Street St, State ST, 88888',
    },
];

const expected10 = [
    {
        first_name: 'First"1',
        last_name: 'Last1',
        email_address: 'email1@email.com',
        address: '1 Street St, State ST, 88888',
    },
    {
        first_name: 'First"2',
        last_name: 'Last2',
        email_address: 'email2@email.com',
        address: '2 Street St, State ST, 88888',
    },
    {
        first_name: 'First"3',
        last_name: 'Last3',
        email_address: 'email3@email.com',
        address: '3 Street St, State ST, 88888',
    },
    {
        first_name: 'First"4',
        last_name: 'Last4',
        email_address: 'email4@email.com',
        address: '4 Street St, State ST, 88888',
    },
    {
        first_name: 'First"5',
        last_name: 'Last5',
        email_address: 'email5@email.com',
        address: '5 Street St, State ST, 88888',
    },
    {
        first_name: 'First"6',
        last_name: 'Last6',
        email_address: 'email6@email.com',
        address: '6 Street St, State ST, 88888',
    },
    {
        first_name: 'First"7',
        last_name: 'Last7',
        email_address: 'email7@email.com',
        address: '7 Street St, State ST, 88888',
    },
    {
        first_name: 'First"8',
        last_name: 'Last8',
        email_address: 'email8@email.com',
        address: '8 Street St, State ST, 88888',
    },
    {
        first_name: 'First"9',
        last_name: 'Last9',
        email_address: 'email9@email.com',
        address: '9 Street St, State ST, 88888',
    },
];

const expected14 = [
    {
        first_name: 'First1',
        last_name: 'Last1',
        email_address: 'email1@email.com',
        address: '1 Street St, State ST, 88888',
    },
    {
        first_name: 'First2',
        last_name: 'Last2',
        email_address: 'email2@email.com',
        address: '2 Street St, State ST, 88888',
    },
    {
        first_name: 'First"3',
        last_name: 'Last3',
        email_address: 'email3@email.com',
        address: '3 Street St, State ST, 88888',
    },
    {
        first_name: 'First"4',
        last_name: 'Last4',
        email_address: 'email4@email.com',
        address: '4 Street St, State ST, 88888',
    },
    {
        first_name: "First'5",
        last_name: 'Last5',
        email_address: 'email5@email.com',
        address: '5 Street St, State ST, 88888',
    },
    {
        first_name: "First'6",
        last_name: 'Last6',
        email_address: 'email6@email.com',
        address: '6 Street St, State ST, 88888',
    },
    {
        first_name: "First'7",
        last_name: 'Last7',
        email_address: 'email7@email.com',
        address: '7 Street St, State ST, 88888',
    },
];

const expected21 = [
    {
        first_name: 'First\n1',
        last_name: 'Last\n1',
        email_address: 'email1@email.com',
        address: '1 Street St,\nState ST, 88888',
    },
    {
        first_name: 'First\n2',
        last_name: 'Last\n2',
        email_address: 'email2@email.com',
        address: '2 Street St,\nState ST, 88888',
    },
];

const expected23 = [
    { first_name: 'First1', last_name: 'Last1', email_address: 'email1@email.com' },
    { first_name: 'First2', last_name: 'Last2', email_address: 'email2@email.com' },
    { first_name: 'First3', last_name: 'Last3', email_address: 'email3@email.com' },
];

const expected25 = [
    {
        first_name: 'First1', last_name: 'Last1', email_address: 'email1@email.com', extra: 'Extra1',
    },
    {
        first_name: 'First3', last_name: 'Last3', email_address: 'email3@email.com', extra: 'Extra2',
    },
];

const expected25Invalid = [ 'First2', 'Last2', 'email2@email.com' ];

const expected26 = [
    {
        Model: '058B',
        Last_Change_Date: '09/09/2003',
        Region: 'GL',
        Make: 'ARONCA',
        Aircraft_Group: '58',
        Regis_Code: '0191006',
        Design_Character: '1H7',
        No_Engines: '1',
        Type_Engine: '',
        Type_Landing_Gear: '',
        TC_Data_Sheet_Number: 'A751',
        TC_Model: 'AERONCA058B',
    },
];

const expected27 = expected26;

const expectedRenameHeaders = [
    {
        firstName: 'First1',
        lastName: 'Last1',
        emailAddress: 'email1@email.com',
        address: '1 Street St, State ST, 88888',
    },
    {
        firstName: 'First2',
        lastName: 'Last2',
        emailAddress: 'email2@email.com',
        address: '2 Street St, State ST, 88888',
    },
    {
        firstName: 'First3',
        lastName: 'Last3',
        emailAddress: 'email3@email.com',
        address: '3 Street St, State ST, 88888',
    },
    {
        firstName: 'First4',
        lastName: 'Last4',
        emailAddress: 'email4@email.com',
        address: '4 Street St, State ST, 88888',
    },
    {
        firstName: 'First5',
        lastName: 'Last5',
        emailAddress: 'email5@email.com',
        address: '5 Street St, State ST, 88888',
    },
    {
        firstName: 'First6',
        lastName: 'Last6',
        emailAddress: 'email6@email.com',
        address: '6 Street St, State ST, 88888',
    },
    {
        firstName: 'First7',
        lastName: 'Last7',
        emailAddress: 'email7@email.com',
        address: '7 Street St, State ST, 88888',
    },
    {
        firstName: 'First8',
        lastName: 'Last8',
        emailAddress: 'email8@email.com',
        address: '8 Street St, State ST, 88888',
    },
    {
        firstName: 'First9',
        lastName: 'Last9',
        emailAddress: 'email9@email.com',
        address: '9 Street St, State ST, 88888',
    },
];

describe('fast-csv parsing', () => {
    const listenForError = (stream, message, next) => {
        let called = false;
        stream
            .on('error', (err) => {
                assert.strictEqual(err.message, message);
                called = true;
            })
            .on('end', () => next(called ? null : new Error(`Expected and error to occur [expectedMessage=${message}]`)));
    };

    it('should parse a csv without quotes or escapes', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true })
            .on('data', data => actual.push(data))
            .on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected4);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should emit a readable event ', (next) => {
        const actual = [];
        const stream = csv.fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true }).on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected4);
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

    it('should emit data as a buffer if objectMode is false', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true, objectMode: false })
            .on('data', data => actual.push(JSON.parse(`${data}`)))
            .on('end', () => {
                assert.deepStrictEqual(actual, expected4);
                assert.strictEqual(9, actual.length);
                next();
            });
    });

    it('should emit data as an object if objectMode is true', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true, objectMode: true })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected4);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should emit data as an object if objectMode is not specified', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true, objectMode: true })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected4);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should allow piping from a stream', (next) => {
        const actual = [];
        const stream = csv({ headers: true })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected4);
                assert.strictEqual(count, actual.length);
                next();
            });
        fs.createReadStream(path.resolve(__dirname, '../assets/test4.csv')).pipe(stream);
    });

    it('should accept a csv string', (next) => {
        const actual = [];
        const csvContent = fs.readFileSync(path.resolve(__dirname, '../assets/test4.csv'), { encoding: 'utf8' });
        csv
            .fromString(csvContent, { headers: true })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected4);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should parse a csv with " escapes', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test1.csv'), { headers: true })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected1);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should parse a csv with without headers', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test2.csv'))
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected2);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it("should parse a csv with ' escapes", (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test3.csv'), { headers: true, quote: "'" })
            .on('data', data => actual.push(data))
            .on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected3);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should allow specifying of columns', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test2.csv'), { headers: [ 'first_name', 'last_name', 'email_address', 'address' ] })
            .on('data', data => actual.push(data))
            .on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected1);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should allow renaming columns', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test1.csv'), { headers: [ 'firstName', 'lastName', 'emailAddress', 'address' ], renameHeaders: true })
            .on('data', data => actual.push(data))
            .on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expectedRenameHeaders);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should propagate an error when trying to rename headers without providing new ones', (next) => {
        const stream = csv
            .fromPath(path.resolve(__dirname, '../assets/test1.csv'), { renameHeaders: true })
            .on('data', () => null);
        listenForError(stream, 'Error renaming headers: new headers must be provided in an array', next);
    });

    it('should propagate an error when trying to rename headers without providing proper ones', (next) => {
        const stream = csv
            .fromPath(path.resolve(__dirname, '../assets/test1.csv'), { renameHeaders: true, headers: true })
            .on('data', () => null);
        listenForError(stream, 'Error renaming headers: new headers must be provided in an array', next);
    });

    it('should propagate an error header length does not match column length', (next) => {
        const stream = csv
            .fromPath(path.resolve(__dirname, '../assets/header_column_mismatch.csv'), { headers: true })
            .on('data', () => null);
        listenForError(stream, 'Unexpected Error: column header mismatch expected: 4 columns got: 5', next);
    });

    it('should allow specifying of columns as a sparse array', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test2.csv'), { headers: [ 'first_name', undefined, 'email_address', undefined ] })
            .on('data', data => actual.push(data))
            .on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected1Sparse);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    describe('.validate', () => {
        it('should allow validation of rows', (next) => {
            const actual = []; const
                invalid = [];
            csv
                .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true })
                .validate(data => parseInt(data.first_name.replace(/^First/, ''), 10) % 2)
                .on('data', data => actual.push(data))
                .on('data-invalid', data => invalid.push(data))
                .on('error', next)
                .on('end', (count) => {
                    assert.deepStrictEqual(invalid, expectedInvalid);
                    assert.deepStrictEqual(actual, expectedValid);
                    assert.strictEqual(count, actual.length);
                    next();
                });
        });

        it('should allow async validation of rows', (next) => {
            const actual = [];
            const invalid = [];
            let validating = false;
            csv
                .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true })
                .validate((data, validateNext) => {
                    validating = true;
                    setImmediate(() => {
                        validating = false;
                        validateNext(null, parseInt(data.first_name.replace(/^First/, ''), 10) % 2);
                    });
                })
                .on('data', (data) => {
                    assert(!validating);
                    actual.push(data);
                })
                .on('data-invalid', data => invalid.push(data))
                .on('error', next)
                .on('end', (count) => {
                    assert.deepStrictEqual(invalid, expectedInvalid);
                    assert.deepStrictEqual(actual, expectedValid);
                    assert.strictEqual(count, actual.length);
                    next();
                });
        });

        it('should propagate errors from async validation', (next) => {
            const actual = [];
            const invalid = [];
            let index = -1;
            const stream = csv
                .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true })
                .validate((data, validateNext) => setImmediate(() => {
                    index += 1;
                    if (index === 8) {
                        validateNext(new Error('Validation ERROR!!!!'));
                    } else {
                        validateNext(null, true);
                    }
                }))
                .on('data', data => actual.push(data))
                .on('data-invalid', data => invalid.push(data));
            listenForError(stream, 'Validation ERROR!!!!', next);
        });

        it('should propagate async errors at the beginning', (next) => {
            const actual = [];
            const invalid = [];
            const stream = csv
                .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true })
                .validate((data, validateNext) => validateNext(new Error('Validation ERROR!!!!')))
                .on('data', data => actual.push(data))
                .on('data-invalid', data => invalid.push(data))
            listenForError(stream, 'Validation ERROR!!!!', next);
        });

        it('should propagate thrown errors', (next) => {
            const actual = []; const invalid = []; let
                index = -1;
            const stream = csv
                .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true })
                .validate((data, validateNext) => {
                    index += 1;
                    if (index === 8) {
                        throw new Error('Validation ERROR!!!!');
                    } else {
                        setImmediate(() => validateNext(null, true));
                    }
                })
                .on('data', data => actual.push(data))
                .on('data-invalid', data => invalid.push(data))
            listenForError(stream, 'Validation ERROR!!!!', next);
        });

        it('should propagate thrown errors at the beginning', (next) => {
            const actual = [];
            const invalid = [];
            const stream = csv
                .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true })
                .validate(() => {
                    throw new Error('Validation ERROR!!!!');
                })
                .on('data', data => actual.push(data))
                .on('data-invalid', data => invalid.push(data));
            listenForError(stream, 'Validation ERROR!!!!', next);
        });
    });

    describe('.transform', () => {
        it('should allow transforming of data', (next) => {
            const actual = [];
            csv
                .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true })
                .transform((data) => {
                    const ret = {};
                    [ 'first_name', 'last_name', 'email_address' ].forEach((prop) => {
                        ret[camelize(prop)] = data[prop];
                    });
                    return ret;
                })
                .on('data', data => actual.push(data))
                .on('error', next)
                .on('end', (count) => {
                    assert.deepStrictEqual(actual, expectedCamelCase);
                    assert.strictEqual(count, actual.length);
                    next();
                });
        });

        it('should async transformation of data', (next) => {
            const actual = []; let
                transforming = false;
            csv
                .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true })
                .transform((data, cb) => {
                    transforming = true;
                    setImmediate(() => {
                        const ret = {};
                        [ 'first_name', 'last_name', 'email_address' ].forEach((prop) => {
                            ret[camelize(prop)] = data[prop];
                        });
                        transforming = false;
                        cb(null, ret);
                    });
                })
                .on('data', (data) => {
                    assert(!transforming);
                    actual.push(data);
                })
                .on('error', next)
                .on('end', (count) => {
                    assert.deepStrictEqual(actual, expectedCamelCase);
                    assert.strictEqual(count, actual.length);
                    next();
                });
        });

        it('should propogate errors when transformation of data', (next) => {
            const actual = []; let
                index = -1;
            const stream = csv
                .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true })
                .transform((data, cb) => setImmediate(() => {
                    index += 1;
                    if (index === 8) {
                        cb(new Error('transformation ERROR!!!!'));
                    } else {
                        const ret = {};
                        [ 'first_name', 'last_name', 'email_address' ].forEach((prop) => {
                            ret[camelize(prop)] = data[prop];
                        });
                        cb(null, ret);
                    }
                }))
                .on('data', (data) => {
                    actual[index] = data;
                })
            listenForError(stream, 'transformation ERROR!!!!', next);
        });

        it('should propogate errors when transformation of data at the beginning', (next) => {
            const actual = [];
            const stream = csv
                .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true })
                .transform((data, cb) => setImmediate(() => cb(new Error('transformation ERROR!!!!'))))
                .on('data', (data, index) => {
                    actual[index] = data;
                });
            listenForError(stream, 'transformation ERROR!!!!', next);
        });


        it('should propagate thrown errors at the end', (next) => {
            const actual = [];
            const invalid = [];
            let index = -1;
            const stream = csv
                .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true })
                .transform((data, cb) => {
                    index += 1;
                    if (index === 8) {
                        throw new Error('transformation ERROR!!!!');
                    } else {
                        setImmediate(() => cb(null, data));
                    }
                })
                .on('data', data => actual.push(data))
                .on('data-invalid', data => invalid.push(data))
            listenForError(stream, 'transformation ERROR!!!!', next);

        });

        it('should propagate thrown errors at the beginning', (next) => {
            const actual = []; const
                invalid = [];
            const stream = csv
                .fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true })
                .transform(() => {
                    throw new Error('transformation ERROR!!!!');
                })
                .on('data', data => actual.push(data))
                .on('data-invalid', data => invalid.push(data))
            listenForError(stream, 'transformation ERROR!!!!', next);
        });
    });

    it('should accept a stream', (next) => {
        const actual = [];
        csv
            .fromStream(fs.createReadStream(path.resolve(__dirname, '../assets/test4.csv')), { headers: true })
            .on('data', data => actual.push(data))
            .on('error', next)
            .on('end', () => {
                assert.deepStrictEqual(actual, expected4);
                next();
            });
    });

    it('should emit an error for invalid rows', (next) => {
        const actual = []; const
            parseErrorCalled = false;
        const stream = csv
            .fromPath(path.resolve(__dirname, '../assets/test6.csv'), { headers: true })
            .on('data', data => actual.push(data));
        listenForError(stream, "Parse Error: expected: '\"' got: 'a'. at 'a   \", Las", next);
    });

    it('should handle a trailing comma', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test7.csv'), { headers: true })
            .on('data', data => actual.push(data))
            .on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected7);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should skip valid, but empty rows with ignoreEmpty option', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test8.csv'), { headers: true, ignoreEmpty: true })
            .on('data', data => actual.push(data))
            .on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected8);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should handle single quotes inside of double quotes', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test9.csv'), { headers: true })
            .on('data', data => actual.push(data))
            .on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected9);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should handle double quotes inside of single quotes', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test10.csv'), { headers: true, quote: "'" })
            .on('data', data => actual.push(data))
            .on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected10);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should handle escaped double quotes inside of double quotes', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test11.csv'), { headers: true, escape: '\\' })
            .on('data', data => actual.push(data))
            .on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected10);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should handle escaped single quotes inside of single quotes', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test12.csv'), { headers: true, quote: "'", escape: '\\' })
            .on('data', data => actual.push(data))
            .on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected9);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should discard extra columns that do not map to a header with discardUnmappedColumns option', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test23.csv'), { headers: true, discardUnmappedColumns: true })
            .on('data', data => actual.push(data))
            .on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected23);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should report missing columns that do not exist but have a header with strictColumnHandling option', (next) => {
        const actual = [];
        let reachedInvalid = false;
        csv
            .fromPath(path.resolve(__dirname, '../assets/test25.csv'), { headers: true, strictColumnHandling: true })
            .on('data', data => actual.push(data))
            .on('data-invalid', (invalid) => {
                assert.deepStrictEqual(invalid, expected25Invalid);
                reachedInvalid = true;
            })
            .on('error', next)
            .on('end', (count) => {
                assert.strictEqual(true, reachedInvalid);
                assert.deepStrictEqual(actual, expected25);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    describe('alternate delimiters', () => {
        it('should support tab delimiters', (next) => {
            const actual = [];
            csv
                .fromPath(path.resolve(__dirname, '../assets/test14.txt'), { headers: true, delimiter: '\t' })
                .on('data', data => actual.push(data))
                .on('error', next)
                .on('end', (count) => {
                    assert.deepStrictEqual(actual, expected14);
                    assert.strictEqual(count, actual.length);
                    next();
                });
        });

        it('should support pipe delimiters', (next) => {
            const actual = [];
            csv
                .fromPath(path.resolve(__dirname, '../assets/test15.txt'), { headers: true, delimiter: '|' })
                .on('data', data => actual.push(data))
                .on('error', next)
                .on('end', (count) => {
                    assert.deepStrictEqual(actual, expected14);
                    assert.strictEqual(count, actual.length);
                    next();
                });
        });

        it('should support semicolon delimiters', (next) => {
            const actual = [];
            csv
                .fromPath(path.resolve(__dirname, '../assets/test16.txt'), { headers: true, delimiter: ';' })
                .on('data', data => actual.push(data))
                .on('error', next)
                .on('end', (count) => {
                    assert.deepStrictEqual(actual, expected14);
                    assert.strictEqual(count, actual.length);
                    next();
                });
        });
    });

    it('should ignore leading white space in front of a quoted value', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test17.csv'), { headers: true })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected1);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should accept a ltrim parameter', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test18.csv'), { ltrim: true, trim: false, headers: true })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected1);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should accept a rtrim parameter', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test19.csv'), { rtrim: true, trim: false, headers: true })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected1);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should accept a trim parameter', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test20.csv'), { trim: true, headers: true })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected1);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should handle CSVs with new lines', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test21.csv'), { headers: true, ignoreEmpty: true })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected21);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should handle CSVs with comments', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test24.csv'), { headers: true, comment: '#' })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected1);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    describe('pause/resume', () => it('should support pausing a stream', (next) => {
        const actual = [];
        let
            paused = false;
        const csvStream = csv.fromPath(path.resolve(__dirname, '../assets/test4.csv'), { headers: true });
        csvStream.on('data', (data) => {
            assert(!paused);
            actual.push(data);
            paused = true;
            csvStream.pause();
            setTimeout(() => {
                assert(paused);
                paused = false;
                csvStream.resume();
            }, 100);
        })
            .on('error', next)
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected4);
                assert.strictEqual(count, actual.length);
                next();
            });
    }));

    it('should throw an error if an invalid path or stream is passed in', () => assert.throws(() => csv().fromString(1)));

    it('should throw an error if a validate is not called with a function', () => assert.throws(() => csv({ headers: true }).fromPath(path.resolve(__dirname, '../assets/test7.csv'))
        .validate('hello')));

    it('should throw an error if a transform is not called with a function', () => assert.throws(() => csv({ headers: true }).fromPath(path.resolve(__dirname, '../assets/test7.csv'))
        .transform('hello')));

    it('should handle tab delimited CSVs with only spaces for field values', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test26.csv'), { headers: true, delimiter: '\t', trim: true })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected26);
                assert.strictEqual(count, actual.length);
                next();
            });
    });

    it('should handle CSVs with only spaces for field values', (next) => {
        const actual = [];
        csv
            .fromPath(path.resolve(__dirname, '../assets/test27.csv'), { headers: true, trim: true })
            .on('data', data => actual.push(data))
            .on('end', (count) => {
                assert.deepStrictEqual(actual, expected27);
                assert.strictEqual(count, actual.length);
                next();
            });
    });
});
