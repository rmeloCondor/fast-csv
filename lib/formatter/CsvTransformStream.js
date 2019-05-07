const { promisify } = require('util');
const _ = require('lodash');
const { Transform } = require('stream');

const FieldsFormatter = require('./FieldsFormatter');


class CsvTransformStream extends Transform {
    static isHashArray(arr) {
        const isArray = Array.isArray(arr);
        return isArray && Array.isArray(arr[0]) && arr[0].length === 2;
    }

    // get headers from a row item
    static gatherHeaders(item) {
        if (CsvTransformStream.isHashArray(item)) {
            // lets assume a multidimesional array with item 0 bing the title
            return item.map(it => it[0]);
        }
        if (Array.isArray(item)) {
            return item;
        }
        return Object.keys(item);
    }

    // transform an object into a CSV row
    static getColumnsFromHashData(row, headers) {
        return headers.map(header => row[header]);
    }

    // transform an array into a CSV row
    static getColumnsFromArrayData(row) {
        return row;
    }

    // transform an array of two item arrays into a CSV row
    static getColumnsFromHashArrayData(row) {
        return row.map(col => col[1]);
    }

    constructor(opts) {
        super({ ...opts, transform: null, objectMode: true });

        this.totalCount = 0;
        this.formatter = new FieldsFormatter(opts, this);
        this.rowDelimiter = opts.rowDelimiter || '\n';
        const hasHeaders = _.has(opts, 'headers') ? !!opts.headers : null;
        const headers = (hasHeaders && Array.isArray(opts.headers)) ? opts.headers : null;
        this.hasHeaders = hasHeaders;
        this.headers = headers;
        this.parsedHeaders = false;
        if (this.hasHeaders && this.headers) {
            this.parsedHeaders = true;
        }
        this.hasWrittenHeaders = !hasHeaders;
        this.includeEndRowDelimiter = !!opts.includeEndRowDelimiter;
        if (_.has(opts, 'transform')) {
            this.transform(opts.transform);
        }
    }

    async _transform(row, encoding, cb) {
        try {
            const transformedRow = await this.__callTransform(row);
            if (this._checkHeaders(transformedRow)) {
                this._writeRow(transformedRow);
            }
            cb();
        } catch (e) {
            cb(e);
        }
    }

    async __callTransform(row) {
        if (this.__transform) {
            return this.__transform(row);
        }
        return row;
    }

    transform(transformFunction) {
        if (!_.isFunction(transformFunction)) {
            this.emit('error', new TypeError('fast-csv.FormatterStream#transform requires a function'));
        }
        if (transformFunction.length === 2) {
            this.__transform = promisify(transformFunction);
        } else {
            this.__transform = transformFunction;
        }
        return this;
    }

    _flush(cb) {
        if (this.includeEndRowDelimiter) {
            this.push(this.rowDelimiter);
        }
        cb();
    }

    // check if we need to write header return true if we should also write a row
    // could be false if headers is true and the header row(first item) is passed in
    _checkHeaders(item) {
        if (!this.parsedHeaders) {
            this.parsedHeaders = true;
            this.headers = CsvTransformStream.gatherHeaders(item);
        }
        if (this.hasWrittenHeaders) {
            return true;
        }
        this._writeRow(this.headers, true);
        this.hasWrittenHeaders = true;
        return CsvTransformStream.isHashArray(item) || !Array.isArray(item);
    }

    // wrapper to determine what transform to run
    _writeRow(row, isHeadersRow = false) {
        if (!Array.isArray(row)) {
            return this._createNewRow(CsvTransformStream.getColumnsFromHashData(row, this.headers), isHeadersRow);
        }
        if (CsvTransformStream.isHashArray(row)) {
            return this._createNewRow(CsvTransformStream.getColumnsFromHashArrayData(row), isHeadersRow);
        }
        return this._createNewRow(CsvTransformStream.getColumnsFromArrayData(row), isHeadersRow);
    }

    _createNewRow(cols, isHeadersRow = false) {
        const row = [];
        if (this.totalCount) {
            row.push(this.rowDelimiter);
        }
        this.totalCount += 1;
        row.push(this.formatter.format(cols, isHeadersRow));
        this.push(Buffer.from(row.join(''), 'utf8'));
    }
}
module.exports = CsvTransformStream;
