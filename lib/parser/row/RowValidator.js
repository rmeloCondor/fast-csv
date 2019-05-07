class RowValidator {
    constructor({ validatorFunction }) {
        this.hasCallback = validatorFunction.length === 2;
        this.validatorFunction = validatorFunction;
    }

    validate(row) {
        if (!this.hasCallback) {
            return Promise.resolve({ isValid: this.validatorFunction(row) });
        }
        return new Promise((res, rej) => {
            this.validatorFunction(row, (err, isValid, reason) => {
                if (err) {
                    return rej(err);
                }
                return res({ isValid, reason });
            });
        });
    }
}

module.exports = RowValidator;
