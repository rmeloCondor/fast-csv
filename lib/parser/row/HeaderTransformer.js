const _ = require('lodash');

class HeadersTransformer {
    constructor(parserOptions) {
        this.parserOptions = parserOptions;
        this.headers = Array.isArray(parserOptions.headers) ? parserOptions.headers : null;
        this.receivedHeaders = Array.isArray(parserOptions.headers);
        this.shouldUseFirstRow = parserOptions.headers === true;
        this.processedFirstRow = false;
        this.headersLength = this.receivedHeaders ? this.headers.length : 0;
    }

    transform(row, cb) {
        if (!this._shouldMapRow(row)) {
            return cb(null, { row: null, isValid: true });
        }
        return cb(null, this._processRow(row));
    }

    _shouldMapRow(row) {
        const { parserOptions } = this;
        if (parserOptions.renameHeaders && !this.processedFirstRow) {
            if (!this.receivedHeaders) {
                throw new Error('Error renaming headers: new headers must be provided in an array');
            }
            this.processedFirstRow = true;
            return false;
        }
        if (!this.receivedHeaders && this.shouldUseFirstRow) {
            this.headers = row;
            this.receivedHeaders = true;
            this.headersLength = row.length;
            return false;
        }
        return true;
    }

    _processRow(row) {
        if (!Array.isArray(this.headers)) {
            return { row, isValid: true };
        }
        const { parserOptions } = this;
        if (!parserOptions.discardUnmappedColumns && row.length > this.headersLength) {
            if (!parserOptions.strictColumnHandling) {
                throw new Error(`Unexpected Error: column header mismatch expected: ${this.headersLength} columns got: ${row.length}`);
            }
            return { row, isValid: false };
        }
        if (parserOptions.strictColumnHandling && (row.length < this.headersLength)) {
            return { row, isValid: false };
        }
        return { row: this._mapHeaders(row), isValid: true };
    }


    _mapHeaders(data) {
        const rowWitHeaders = {};
        const { headers, headersLength } = this;
        for (let i = 0; i < headersLength; i += 1) {
            const header = headers[i];
            if (!_.isUndefined(header)) {
                const val = data[i];
                // eslint-disable-next-line no-param-reassign
                rowWitHeaders[header] = _.isUndefined(val) ? '' : val;
            }
        }
        return rowWitHeaders;
    }
}

module.exports = HeadersTransformer;
