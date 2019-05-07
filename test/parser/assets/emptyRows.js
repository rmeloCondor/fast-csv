const path = require('path');
const { EOL } = require('os');

const content = [
    'first_name,last_name,email_address',
    '"","",""',
    '"","",""',
    '"","",',
    '"",,""',
    ',,',
    '',
].join(EOL);

const parsed = [
    {
        first_name: '',
        last_name: '',
        email_address: '',
    },
    {
        first_name: '',
        last_name: '',
        email_address: '',
    },
    {
        first_name: '',
        last_name: '',
        email_address: '',
    },
    {
        first_name: '',
        last_name: '',
        email_address: '',
    },
    {
        first_name: '',
        last_name: '',
        email_address: '',
    },
];

module.exports = {
    path: path.resolve(__dirname, 'tmp', 'empty_rows.csv'),
    content,
    parsed,
};
