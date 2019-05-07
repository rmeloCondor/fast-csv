const util = require('util');
const _ = require('lodash');
const fs = require('fs');
const { Writable } = require('stream');
const CsvTransformStream = require('./CsvTransformStream');

function createWriteStream(options) {
    return new CsvTransformStream(options);
}

function write(arr, options) {
    const csvStream = createWriteStream(options);
    const promiseWrite = util.promisify((item, cb) => {
        csvStream.write(item, null, cb);
    });
    arr.reduce((prev, row) => prev.then(() => promiseWrite(row)), Promise.resolve())
        .then(() => csvStream.end())
        .catch(err => csvStream.emit('error', err));
    return csvStream;
}

function writeToStream(ws, arr, options) {
    return write(arr, options).pipe(ws);
}

function writeToBuffer(arr, opts, done) {
    let options = opts;
    let cb = done;
    if (_.isFunction(options)) {
        // eslint-disable-next-line no-param-reassign
        cb = options;
        // eslint-disable-next-line no-param-reassign
        options = {};
    }
    const buffers = [];
    const ws = new Writable({
        write(data, enc, writeCb) {
            buffers.push(data);
            writeCb();
        },
    });
    ws
        .on('error', cb)
        .on('finish', () => cb(null, Buffer.concat(buffers)));
    write(arr, options).pipe(ws);
}


function writeToString(arr, options, cb) {
    return writeToBuffer(arr, options, (err, buffer) => {
        if (err) {
            return cb(err);
        }
        return cb(null, buffer.toString());
    });
}

function writeToPath(path, arr, options) {
    const stream = fs.createWriteStream(path, { encoding: 'utf8' });
    return write(arr, options).pipe(stream);
}

createWriteStream.writeToBuffer = writeToBuffer;
createWriteStream.write = write;
createWriteStream.createWriteStream = createWriteStream;
createWriteStream.writeToString = writeToString;
createWriteStream.writeToPath = writeToPath;
createWriteStream.writeToStream = writeToStream;
module.exports = createWriteStream;
