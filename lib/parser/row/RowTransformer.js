const utils = require('util');

class RowTransformer {
    constructor({ transformFunction }) {
        this.hasCallback = transformFunction.length === 2;
        if (this.hasCallback) {
            this.transformFunction = utils.promisify(transformFunction);
        } else {
            this.transformFunction = transformFunction;
        }
    }

    transform(row) {
        if (!this.hasCallback) {
            return Promise.resolve(this.transformFunction(row));
        }
        return this.transformFunction(row);
    }
}

module.exports = RowTransformer;
