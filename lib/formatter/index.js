const CsvFormatterStream = require('./CsvFormatterStream');
const FormatterOptions = require('./FormatterOptions');

const {
    writeToBuffer, write, writeToString, writeToPath, writeToStream,
} = CsvFormatterStream;

function format(options = {}) {
    return new CsvFormatterStream(new FormatterOptions(options));
}

format.write = write;
format.writeToStream = writeToStream;
format.writeToBuffer = writeToBuffer;
format.writeToString = writeToString;
format.writeToPath = writeToPath;
module.exports = format;
