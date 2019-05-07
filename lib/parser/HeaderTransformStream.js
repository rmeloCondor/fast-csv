const _ = require('lodash');
const { Transform } = require('stream');

class HeadersTransformStream extends Transform {
    constructor({
        headers = null,
        renameHeaders = false,
        discardUnmappedColumns = false,
        strictColumnHandling = false,
    }) {
        super({ objectMode: true });
        this.discardUnmappedColumns = discardUnmappedColumns;
        this.strictColumnHandling = strictColumnHandling;
        this.headers = Array.isArray(headers) ? headers : null;
        this.receivedHeaders = Array.isArray(headers);
        this.shouldUseFirstRow = headers === true;
        this.processedFirstRow = false;
        this.renameHeaders = renameHeaders;
        this.headersLength = this.receivedHeaders ? this.headers.length : 0;
    }

    _transform(data, encoding, done) {
        try {
            if (!this._shouldMapRows(data)) {
                return done();
            }
            const row = this._processRow(data);
            if (row) {
                return done(null, row);
            }
            return done();
        } catch (e) {
            return done(e);
        }
    }

    _shouldMapRows(data) {
        if (this.renameHeaders && !this.processedFirstRow) {
            if (!this.receivedHeaders) {
                throw new Error('Error renaming headers: new headers must be provided in an array');
            }
            this.processedFirstRow = true;
            return false;
        }
        if (!this.receivedHeaders && this.shouldUseFirstRow) {
            this.headers = data;
            this.receivedHeaders = true;
            this.headersLength = data.length;
            return false;
        }
        return true;
    }

    _processRow(data) {
        if (!Array.isArray(this.headers)) {
            return data;
        }
        const row = [ ...data ];
        if (row.length > this.headersLength) {
            if (this.discardUnmappedColumns) {
                row.splice(this.headersLength);
            } else if (this.strictColumnHandling) {
                this.emit('data-invalid', data);
                return null;
            } else {
                throw new Error(`Unexpected Error: column header mismatch expected: ${this.headersLength} columns got: ${row.length}`);
            }
        }
        if (this.strictColumnHandling && (row.length < this.headersLength)) {
            this.emit('data-invalid', data);
            return null;
        }
        return this._mapHeaders(row);
    }


    _mapHeaders(data) {
        return this.headers.reduce((ret, header, i) => {
            if (!_.isUndefined(header)) {
                const val = data[i];
                // eslint-disable-next-line no-param-reassign
                ret[header] = _.isUndefined(val) ? '' : val;
            }
            return ret;
        }, {});
    }
}

module.exports = HeadersTransformStream;
