const _ = require('lodash');
const { Transform } = require('stream');
const { RowTransformer, RowValidator } = require('./row');


const defaultOpts = {
    objectMode: true,
};

class RowTransformStream extends Transform {
    constructor(opts = defaultOpts) {
        const options = { ...defaultOpts, ...opts };
        super({ writableObjectMode: true, readableObjectMode: options.objectMode });
        this.__endEmitted = false;
        this._rowCount = -1;
        this._emitData = false;
        this.__objectMode = options.objectMode;
        this.__transformers = [];
        this.__validators = [];
    }

    get rowCount() {
        return this._rowCount;
    }

    emit(event, ...rest) {
        if (event === 'end') {
            if (!this.__endEmitted) {
                this.__endEmitted = true;
                this._rowCount += 1;
                super.emit('end', this.rowCount);
            }
            return;
        }
        super.emit(event, ...rest);
    }

    on(evt, ...rest) {
        if (evt === 'data' || evt === 'readable') {
            this._emitData = true;
        }
        return super.on(evt, ...rest);
    }

    validate(validatorFunction) {
        if (!_.isFunction(validatorFunction)) {
            return this.emit('error', new TypeError('fast-csv.Parser#validate requires a function'));
        }
        this.__validators.push(new RowValidator({ validatorFunction, emitter: this }));
        return this;
    }

    transform(transformFunction) {
        if (!_.isFunction(transformFunction)) {
            return this.emit('error', new TypeError('fast-csv.Parser#transform requires a function'));
        }
        this.__transformers.push(new RowTransformer({ transformFunction }));
        return this;
    }

    _transform(row, encoding, done) {
        try {
            let doneCalled = false;
            const nextRowCount = this._rowCount + 1;
            this.__callTransformers(row).then((transformedRow) => {
                if (!transformedRow) {
                    return done();
                }
                return this.__callValidators(transformedRow, nextRowCount).then(({ isValid, reason }) => {
                    if (!isValid) {
                        this.emit('data-invalid', transformedRow, nextRowCount, reason);
                        return done();
                    }
                    this._rowCount = nextRowCount;
                    doneCalled = true;
                    return done(null, this.__objectMode ? transformedRow : JSON.stringify(transformedRow));
                });
            })
                .catch((e) => {
                    if (doneCalled) {
                        return this.emit('error', e);
                    }
                    doneCalled = true;
                    return done(e);
                });
        } catch (e) {
            done(e);
        }
    }

    __callTransformers(row) {
        return this.__transformers.reduce((prev, next) => prev.then((transformedRow) => {
            if (!transformedRow) {
                return transformedRow;
            }
            return next.transform(transformedRow);
        }), Promise.resolve(row));
    }

    __callValidators(row) {
        return this.__validators.reduce((prev, next) => prev.then((validationResult) => {
            if (!validationResult.isValid) {
                return validationResult;
            }
            return next.validate(row);
        }), Promise.resolve({ isValid: true, reason: null }));
    }
}

module.exports = RowTransformStream;
