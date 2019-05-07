// const assert = require('assert');
// const {HeaderTransformer} = require('../../../lib/parser/parser_stream/transforms');
//
// describe('header-transformer', () => {
//     const mockEmitter = () => ({
//         called: [],
//         emit(event, data) {
//             this.called.push({ event, data });
//             return this;
//         },
//     });
//
//     it('should map header columns to an array of data', (next) => {
//         const headers = [ 'a', 'b', 'c' ];
//         const row = [ '1', '2', '3' ];
//         const emitter = mockEmitter();
//         const transformer = new HeaderTransformer({})
//         return headerTransformer(headers, { emitter })(row, (err, transformed) => {
//             if (err) {
//                 return next(err);
//             }
//             return assert.strictEqual(transformed, { a: '1', b: '2', c: '2' });
//         });
//     });
// });
