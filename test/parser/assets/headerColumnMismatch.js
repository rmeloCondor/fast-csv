const path = require('path');
const { EOL } = require('os');

const content = [
    'first_name,last_name,email_address,address',
    'First1,Last1,email1@email.com,"1 Street St, State ST, 88888", extra column',
].join(EOL);

const parsed = [
    {
        first_name: 'First1',
        last_name: 'Last1',
        email_address: 'email1@email.com',
        address: '1 Street St, State ST, 88888',
    },
];

module.exports = {
    path: path.resolve(__dirname, 'tmp', 'header_column_mismatch.csv'),
    content,
    parsed,
};
