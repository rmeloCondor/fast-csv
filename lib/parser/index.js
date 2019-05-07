
const CsvReader = require('./CsvReader');
const { Readable } = require('stream');
const fs = require('fs');
const ParserTransformStream = require('./ParserTransformStream');
const RowTransformStream = require('./RowTransformStream');
const HeaderTransformStream = require('./HeaderTransformStream');

const parse = (options = {}) => {
    const parserTransformStream = new ParserTransformStream(options);
    const headersTransformStream = new HeaderTransformStream(options);
    const rowTransformStream = new RowTransformStream(options);
    parserTransformStream.pipe(headersTransformStream).pipe(rowTransformStream);
    // headersTransformStream.on('error', (...args) => rowTransformStream.emit('error', ...args))
    headersTransformStream.on('data-invalid', (...args) => rowTransformStream.emit('data-invalid', ...args))
    return new CsvReader(parserTransformStream, rowTransformStream, { ...options, objectMode: true });
};

const fromStream = (stream, options) => stream.pipe(parse(options));

const fromPath = (location, options) => fs.createReadStream(location).pipe(parse(options));

const fromString = (string, options) => {
    const rs = new Readable();
    rs.push(string);
    rs.push(null);
    return rs.pipe(parse(options));
};

parse.fromStream = fromStream;
parse.fromPath = fromPath;
parse.fromString = fromString;
module.exports = parse;
