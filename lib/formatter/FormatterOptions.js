const _ = require('lodash');

class FormatterOptions {
    static get default() {
        return new FormatterOptions({});
    }

    constructor({
        objectMode = true,
        delimiter = ',',
        rowDelimiter = '\n',
        quote = '"',
        escape = quote,
        quoteColumns = false,
        quoteHeaders = quoteColumns,
        headers = null,
        includeEndRowDelimiter = false,
        transform = null,
    }) {
        this.objectMode = objectMode;
        this.delimiter = delimiter;
        this.rowDelimiter = rowDelimiter;
        this.quote = quote;
        this.escape = escape;
        this.quoteColumns = quoteColumns;
        this.quoteHeaders = quoteHeaders;
        this.headers = Array.isArray(headers) ? headers : null;
        this.hasProvidedHeaders = !!headers;
        this.includeEndRowDelimiter = includeEndRowDelimiter;
        this.transform = _.isFunction(transform) ? transform : null;
        this.escapedQuote = `${this.escape}${this.quote}`;
    }
}

module.exports = FormatterOptions;
