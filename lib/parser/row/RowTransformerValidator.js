const _ = require('lodash');

class RowTransformerValidator {
    static createTransform(transformFunction) {
        const isSync = transformFunction.length === 1;
        if (isSync) {
            return (row, cb) => cb(null, transformFunction(row));
        }
        return (row, cb) => transformFunction(row, cb);
    }

    static createValidator(validateFunction) {
        const isSync = validateFunction.length === 1;
        if (isSync) {
            return (row, cb) => cb(null, { isValid: validateFunction(row) });
        }
        return (row, cb) => validateFunction(row, (err, isValid, reason) => {
            if (err) {
                return cb(err);
            }
            return cb(null, { isValid, reason });
        });
    }

    constructor() {
        this._rowTransform = null;
        this._rowValidator = null;
    }

    set rowTransform(transformFunction) {
        if (!_.isFunction(transformFunction)) {
            throw new TypeError('The transform should be a function');
        }
        this._rowTransform = RowTransformerValidator.createTransform(transformFunction);
        return this._rowTransform;
    }

    set rowValidator(validateFunction) {
        if (!_.isFunction(validateFunction)) {
            throw new TypeError('The validate should be a function');
        }
        this._rowValidator = RowTransformerValidator.createValidator(validateFunction);
        return this._rowValidator;
    }

    transformAndValidate(row, cb) {
        return this.__callTransformer(row, (tranformErr, transformedRow) => {
            if (tranformErr) {
                return cb(tranformErr);
            }
            if (!transformedRow) {
                return cb(null, { row: null, isValid: true });
            }
            return this.__callValidator(transformedRow, (validateErr, validationResult) => {
                if (validateErr) {
                    return cb(validateErr);
                }
                if (validationResult && !validationResult.isValid) {
                    return cb(null, { row: transformedRow, isValid: false, reason: validationResult.reason });
                }
                return cb(null, { row: transformedRow, isValid: true });
            });
        });
    }

    __callTransformer(row, cb) {
        if (!this._rowTransform) {
            return cb(null, row);
        }
        return this._rowTransform(row, cb);
    }

    __callValidator(row, cb) {
        if (!this._rowValidator) {
            return cb(null, { isValid: true });
        }
        return this._rowValidator(row, cb);
    }
}

module.exports = RowTransformerValidator;
