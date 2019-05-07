const _ = require('lodash');

const CARRIAGE_RETURN = '\r';

class ParserOptions {
    static get default() {
        return new ParserOptions({});
    }

    /**
     * Object for holding parser options
     * @param {Boolean} objectMode=true Set to false to have the parser emit a JSON string version of the row
     * @param {String} delimiter=',' The delimiter to used to seperate columns
     * @param {Boolean} ignoreEmpty=false Set to true to ignore rows with alll empty columns.
     * @param {String} quote='"' The character to use to escape values that contain a delimiter. If you set to null
     * then all quoting will be ignored
     * @param {String} escape='"' The character to use when escaping a value that is quoted and contains a quote
     * character.
     * @param {String} comment=null Set to a character that is used for commenting.
     * @param {Boolean} ltrim=false Set to true to left trim all columns.
     * @param {Boolean} rtrim=false Set to true to right trim all columns.
     * @param {Boolean} trim=false Set to true to trim all columns.
     * @param {String|Array<String>} headers=null  Set to true if you expect the first line of your CSV to contain
     * headers, alternately you can specify an array of headers to use. You can also specify a sparse array to omit
     * some of the columns.
     * @param {Boolean} renameHeaders=false Set to true to skip the first row and use the provided headers.
     * @param {Boolean} strictColumnHandling=false Set to true to emit `invalid-data` events when a row with a
     * different number of columns than headers is encountered.
     * @param {Boolean} discardUnmappedColumns=false Set to true to discard extra columns found in a row.
     */
    constructor({
        objectMode = true,
        delimiter = ',',
        ignoreEmpty = false,
        quote = '"',
        escape = null,
        comment = null,
        ltrim = false,
        rtrim = false,
        trim = false,
        headers = null,
        renameHeaders = false,
        strictColumnHandling = false,
        discardUnmappedColumns = false,
    }) {
        this.objectMode = objectMode === true;
        this.delimiter = delimiter;
        if (delimiter.length > 1) {
            throw new Error('delimiter option must be one character long');
        }
        this.escapedDelimiter = _.escapeRegExp(delimiter);
        this.strictColumnHandling = strictColumnHandling === true;
        this.quote = quote;
        this.escapeChar = _.isString(escape) ? escape : quote;
        this.comment = comment;
        this.supportsComments = !_.isNil(this.comment);
        this.ignoreEmptyRow = ignoreEmpty;
        this.trim = trim === true;
        this.ltrim = ltrim === true;
        this.rtrim = rtrim === true;
        this.discardUnmappedColumns = discardUnmappedColumns === true;
        this.strictColumnHandling = strictColumnHandling === true;
        this.headers = headers;
        this.renameHeaders = renameHeaders === true;
        this.carriageReturn = CARRIAGE_RETURN;
        this.NEXT_TOKEN_REGEXP = new RegExp(`([^\\s]|\\r\\n|\\n|\\r|${this.escapedDelimiter})`);
    }
}

module.exports = ParserOptions;
