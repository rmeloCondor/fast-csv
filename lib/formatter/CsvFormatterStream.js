const { promisify } = require('util');
const { Transform, Writable } = require('stream');
const fs = require('fs');
const FormatterOptions = require('./FormatterOptions');
const { RowFormatter } = require('./formatter');


class CsvFormatterStream extends Transform {
    static write(arr, options = {}) {
        const csvStream = new CsvFormatterStream(new FormatterOptions(options));
        const promiseWrite = promisify((item, cb) => {
            csvStream.write(item, null, cb);
        });
        arr.reduce((prev, row) => prev.then(() => promiseWrite(row)), Promise.resolve())
            .then(() => csvStream.end())
            .catch(err => csvStream.emit('error', err));
        return csvStream;
    }

    static writeToStream(ws, arr, options) {
        return CsvFormatterStream.write(arr, options).pipe(ws);
    }

    static writeToBuffer(arr, opts = {}) {
        const buffers = [];
        const ws = new Writable({
            write(data, enc, writeCb) {
                buffers.push(data);
                writeCb();
            },
        });
        return new Promise((res, rej) => {
            ws
                .on('error', rej)
                .on('finish', () => res(Buffer.concat(buffers)));
            CsvFormatterStream.write(arr, opts).pipe(ws);
        });
    }


    static writeToString(arr, options) {
        return CsvFormatterStream.writeToBuffer(arr, options).then(buffer => buffer.toString());
    }

    static writeToPath(path, arr, options) {
        const stream = fs.createWriteStream(path, { encoding: 'utf8' });
        return CsvFormatterStream.write(arr, options).pipe(stream);
    }

    constructor(formatterOptions = FormatterOptions.default) {
        if (!formatterOptions || !(formatterOptions instanceof FormatterOptions)) {
            throw new TypeError('formatterOptions is required');
        }
        super({ objectMode: formatterOptions.objectMode });
        this.formatterOptions = formatterOptions;
        this.rowFormatter = new RowFormatter(formatterOptions);
    }

    transform(transformFunction) {
        this.rowFormatter.rowTransform = transformFunction;
        return this;
    }

    _transform(row, encoding, cb) {
        try {
            this.rowFormatter.format(row, (err, rows) => {
                if (err) {
                    return cb(err);
                }
                if (rows) {
                    rows.forEach((r) => {
                        this.push(Buffer.from(r, 'utf8'));
                    });
                }
                return cb();
            });
        } catch (e) {
            cb(e);
        }
    }

    _flush(cb) {
        if (this.formatterOptions.includeEndRowDelimiter) {
            this.push(this.formatterOptions.rowDelimiter);
        }
        cb();
    }
}
module.exports = CsvFormatterStream;
