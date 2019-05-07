const _ = require('lodash');
const FieldFormatter = require('./FieldFormatter');

class RowFormatter {
    static isHashArray(arr) {
        const isArray = Array.isArray(arr);
        return isArray && Array.isArray(arr[0]) && arr[0].length === 2;
    }

    // get headers from a row item
    static gatherHeaders(item) {
        if (RowFormatter.isHashArray(item)) {
            // lets assume a multidimesional array with item 0 being the header
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

    static createTransform(transformFunction) {
        const isSync = transformFunction.length !== 2;
        if (isSync) {
            return (row, cb) => {
                let transformedRow = null;
                try {
                    transformedRow = transformFunction(row);
                } catch (e) {
                    return cb(e);
                }
                return cb(null, transformedRow);
            };
        }
        return (row, cb) => transformFunction(row, cb);
    }

    constructor(formatterOptions) {
        this.formatterOptions = formatterOptions;
        this.fieldFormatter = new FieldFormatter(formatterOptions);
        this._rowTransform = null;
        this.headers = formatterOptions.headers;
        this.parsedHeaders = formatterOptions.hasProvidedHeaders && formatterOptions.headers;
        this.hasWrittenHeaders = !formatterOptions.hasProvidedHeaders;
        if (this.parsedHeaders) {
            this.fieldFormatter.headers = formatterOptions.headers;
        }
        this.rowCount = 0;
        if (formatterOptions.transform) {
            this.rowTransform = formatterOptions.transform;
        }
    }

    set rowTransform(transformFunction) {
        if (!_.isFunction(transformFunction)) {
            throw new TypeError('The transform should be a function');
        }
        this._rowTransform = RowFormatter.createTransform(transformFunction);
        return this._rowTransform;
    }

    format(row, cb) {
        this.__callTransformer(row, (err, transformedRow) => {
            if (err) {
                return cb(err);
            }
            const rows = [];
            const { shouldFormatColumns, headers } = this._checkHeaders(transformedRow);
            if (headers) {
                rows.push(this._formatColumns(headers, true));
            }
            if (shouldFormatColumns) {
                const columns = this._gatherColumns(transformedRow, false);
                rows.push(this._formatColumns(columns, false));
            }
            return cb(null, rows);
        });
    }

    // check if we need to write header return true if we should also write a row
    // could be false if headers is true and the header row(first item) is passed in
    _checkHeaders(row) {
        if (!this.parsedHeaders) {
            this.parsedHeaders = true;
            this.headers = RowFormatter.gatherHeaders(row);
            this.fieldFormatter.headers = this.headers;
        }
        if (this.hasWrittenHeaders) {
            return { shouldFormatColumns: true, headers: null };
        }
        this.hasWrittenHeaders = true;
        const shouldFormatColumns = RowFormatter.isHashArray(row) || !Array.isArray(row);
        return { shouldFormatColumns, headers: this.headers };
    }

    _gatherColumns(row) {
        if (!Array.isArray(row)) {
            return RowFormatter.getColumnsFromHashData(row, this.headers);
        }
        if (RowFormatter.isHashArray(row)) {
            return RowFormatter.getColumnsFromHashArrayData(row);
        }
        return RowFormatter.getColumnsFromArrayData(row);
    }

    __callTransformer(row, cb) {
        if (!this._rowTransform) {
            return cb(null, row);
        }
        return this._rowTransform(row, cb);
    }

    _formatColumns(columns, isHeadersRow) {
        const formattedCols = columns
            .map((field, i) => this.fieldFormatter.format(field, i, isHeadersRow))
            .join(this.formatterOptions.delimiter);
        const { rowCount } = this;
        this.rowCount += 1;
        if (rowCount) {
            return [ this.formatterOptions.rowDelimiter, formattedCols ].join('');
        }
        return formattedCols;
    }
}

module.exports = RowFormatter;
