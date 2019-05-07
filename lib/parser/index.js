
const CsvParserStream = require('./CsvParserStream');
const ParserOptions = require('./ParserOptions');

const { fromStream, fromPath, fromString } = CsvParserStream;

const parse = (options = {}) => new CsvParserStream(new ParserOptions(options));

parse.fromStream = fromStream;
parse.fromPath = fromPath;
parse.fromString = fromString;
module.exports = parse;
