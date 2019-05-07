const _ = require('lodash');

class FieldFormatter {
    constructor(formatterOptions) {
        this.formatterOptions = formatterOptions;
        this._headers = formatterOptions.headers;
        this.REPLACE_REGEXP = new RegExp(formatterOptions.quote, 'g');
        this.ESCAPE_REGEXP = new RegExp(`[${formatterOptions.delimiter}${_.escapeRegExp(formatterOptions.rowDelimiter)}']`);
    }

    set headers(headers) {
        if (!Array.isArray(headers)) {
            throw new TypeError('headers should be an Array');
        }
        this._headers = headers;
    }

    shouldQuote(fieldIndex, isHeader) {
        const quoteConfig = isHeader ? this.formatterOptions.quoteHeaders : this.formatterOptions.quoteColumns;
        if (_.isBoolean(quoteConfig)) {
            return quoteConfig;
        }
        if (Array.isArray(quoteConfig)) {
            return quoteConfig[fieldIndex];
        }
        return quoteConfig[this._headers[fieldIndex]];
    }

    format(field, fieldIndex, isHeader) {
        const preparedField = `${_.isNil(field) ? '' : field}`.replace(/\0/g, '');
        const { formatterOptions } = this;
        const shouldEscape = preparedField.indexOf(formatterOptions.quote) !== -1;
        if (shouldEscape) {
            return this._quoteField(
                preparedField.replace(this.REPLACE_REGEXP, formatterOptions.escapedQuote)
            );
        }
        const hasEscapeCharacters = preparedField.search(this.ESCAPE_REGEXP) !== -1;
        if (hasEscapeCharacters || this.shouldQuote(fieldIndex, isHeader)) {
            return this._quoteField(preparedField);
        }
        return preparedField;
    }

    _quoteField(field) {
        return [ this.formatterOptions.quote, field, this.formatterOptions.quote ].join('');
    }
}

module.exports = FieldFormatter;
