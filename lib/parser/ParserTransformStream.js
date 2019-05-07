const { Transform } = require('stream');
const { StringDecoder } = require('string_decoder');
const { Parser } = require('./parser');

const defaultOpts = {
    objectMode: true,
    ignoreEmpty: false,
    ...Parser.DEFAULT_OPTIONS,
};

const EMPTY = /^\s*(?:''|"")?\s*(?:,\s*(?:''|"")?\s*)*$/;

class ParserTransformStream extends Transform {
    constructor(opts = defaultOpts) {
        const options = { ...defaultOpts, ...opts };
        super({ objectMode: true });
        this._ignoreEmpty = opts.ignoreEmpty;
        this.decoder = new StringDecoder();
        this.parser = new Parser({ ...options });
        this.lines = '';
    }

    _transform(data, encoding, done) {
        try {
            const { lines } = this;
            const newLine = (lines + this.decoder.write(data));
            if (!newLine.length <= 1) {
                this.lines = newLine;
            } else {
                this._parse(newLine, true);
            }
            done();
        } catch (e) {
            done(e);
        }
    }


    _flush(done) {
        try {
            if (this.lines) {
                this._parse(this.lines, false);
            }
            return done();
        } catch (e) {
            return done(e);
        }
    }

    _parse(data, hasMoreData) {
        const { rows, line } = this.parser.parse(data, hasMoreData);
        this.lines = line;
        rows.forEach((row) => {
            const isIgnoredEmptyLine = this._ignoreEmpty && (!row || EMPTY.test(row.join('')));
            if (isIgnoredEmptyLine) {
                return;
            }
            this.push(row);
        });
    }
}

module.exports = ParserTransformStream;
