const fs = require('fs');

const noHeadersAndQuotes = require('./noHeadersAndQuotes');
const withHeaders = require('./withHeaders');
const withHeadersAndQuotes = require('./withHeadersAndQuotes');
const withHeadersAndAlternateQuote = require('./withHeadersAndAlternateQuote');
const withHeadersAndMissingColumns = require('./withHeadersAndMissingColumns');
const withHeadersAlternateDelimiter = require('./withHeadersAlternateDelimiter');
const headerColumnMismatch = require('./headerColumnMismatch');
const malformed = require('./malformed');
const trailingComma = require('./trailingComma');
const emptyRows = require('./emptyRows');

const write = ({ path, content }) => fs.writeFileSync(path, content);

module.exports = {
    write,
    withHeaders,
    withHeadersAndQuotes,
    withHeadersAndAlternateQuote,
    withHeadersAndMissingColumns,
    withHeadersAlternateDelimiter,
    noHeadersAndQuotes,
    headerColumnMismatch,
    malformed,
    trailingComma,
    emptyRows,
};
