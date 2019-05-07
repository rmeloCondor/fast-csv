const Duplexify = require('duplexify');

class CsvReader extends Duplexify {
    constructor(
        parserStream,
        rowTransformStream,
        { objectMode = true }
    ) {
        super(parserStream, rowTransformStream, { objectMode });
        this.parserStream = parserStream;
        this.rowTranformStream = rowTransformStream;
    }


    setReadable(readable) {
        super.setReadable(readable);
        readable.on('data-invalid', (...args) => this.emit('data-invalid', ...args));
    }

    setWriteable(writeable) {
        super.setWriteable(writeable);
        writeable.on('data-invalid', (...args) => this.emit('data-invalid', ...args));
    }

    emit(event, ...rest) {
        if (event === 'end') {
            super.emit('end', this.rowTranformStream.rowCount);
            return;
        }
        super.emit(event, ...rest);
    }

    transform(transformFunction){
        this.rowTranformStream.transform(transformFunction);
        return this;
    }

    validate(validateFunction){
        this.rowTranformStream.validate(validateFunction);
        return this;
    }
}

module.exports = CsvReader;