const _ = require('lodash');
const LINE_BREAK = require('os').EOL;

class FieldsFormatter {
    static createQuoteChecker(stream, quoteColumns, quoteHeaders) {
        if (_.isBoolean(quoteColumns)) {
            if (_.isBoolean(quoteHeaders)) {
                return (index, isHeader) => (isHeader ? quoteHeaders : quoteColumns);
            }
            if (Array.isArray(quoteHeaders)) {
                return (index, isHeader) => (isHeader ? quoteHeaders[index] : quoteColumns);
            }
            return (index, isHeader) => (isHeader ? quoteHeaders[stream.headers[index]] : quoteColumns);
        }
        if (Array.isArray(quoteColumns)) {
            if (_.isBoolean(quoteHeaders)) {
                return (index, isHeader) => (isHeader ? quoteHeaders : quoteColumns[index]);
            }
            return (index, isHeader) => (isHeader ? quoteHeaders[index] : quoteColumns[index]);
        }
        if (_.isBoolean(quoteHeaders)) {
            return (index, isHeader) => (isHeader ? quoteHeaders : quoteColumns[stream.headers[index]]);
        }
        return (index, isHeader) => {
            if (isHeader) {
                return quoteHeaders[stream.headers[index]];
            }
            return quoteColumns[stream.headers[index]];
        };
    }

    constructor({
        delimiter = ',',
        rowDelimiter = LINE_BREAK,
        quote = '"',
        escape = '"',
        quoteColumns = false,
        quoteHeaders = quoteColumns,
    }, stream) {
        this.delimiter = delimiter;
        this.rowDelimiter = rowDelimiter;
        this.quote = quote;
        this.escape = escape;
        this.quoteColumns = quoteColumns;
        this.quoteHeaders = quoteHeaders;
        this.ESCAPE_REGEXP = new RegExp(`[${delimiter}${_.escapeRegExp(rowDelimiter)}']`);
        this.REPLACE_REGEXP = new RegExp(quote, 'g');
        this.shouldQuote = FieldsFormatter.createQuoteChecker(stream, quoteColumns, quoteHeaders);
    }

    format(fields, isHeader) {
        return fields.map((field, i) => {
            const preparedField = `${_.isNil(field) ? '' : field}`;
            return this.escapeField(preparedField, i, isHeader);
        }).join(this.delimiter);
    }

    escapeField(field, index, isHeader) {
        let preparedField = field.replace(/\0/g, '');
        let shouldEscape = preparedField.indexOf(this.quote) !== -1;
        if (shouldEscape) {
            preparedField = preparedField.replace(this.REPLACE_REGEXP, escape + this.quote);
            return this.quoteField(preparedField);
        }
        shouldEscape = preparedField.search(this.ESCAPE_REGEXP) !== -1;
        shouldEscape = shouldEscape || this.shouldQuote(index, isHeader);
        if (shouldEscape) {
            return this.quoteField(preparedField);
        }
        return preparedField;
    }

    quoteField(field) {
        return [ this.quote, field, this.quote ].join('');
    }
}

module.exports = FieldsFormatter;
