/**
 * @projectName fast-csv
 * @github https://github.com/C2FO/fast-csv
 * @includeDoc [Change Log] ../History.md
 * @header [../README.md]
 */

const parser = require('./parser');
const formatter = require('./formatter');

function csv(...args) {
    return parser(...args);
}

csv.parse = csv;
csv.fromString = parser.fromString;
csv.fromPath = parser.fromPath;
csv.fromStream = parser.fromStream;
csv.format = formatter;
csv.write = formatter.write;
csv.writeToStream = formatter.writeToStream;
csv.writeToString = formatter.writeToString;
csv.writeToBuffer = formatter.writeToBuffer;
csv.writeToPath = formatter.writeToPath;
csv.createWriteStream = formatter.createWriteStream;
csv.createReadStream = formatter.createWriteStream;

module.exports = csv;
