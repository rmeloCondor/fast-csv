const { Writable } = require('stream');

class RecordingStream extends Writable {
    constructor() {
        super({
            write: (data, enc, cb) => {
                this.data.push(data.toString());
                cb();
            },
        });
        this.data = [];
    }
}

module.exports = {
    RecordingStream,
};
