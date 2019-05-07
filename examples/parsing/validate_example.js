const fs = require('fs');
const path = require('path');
const csv = require('../../');

const stream = fs.createReadStream(path.resolve(__dirname, '../assets', 'snake_case_users.csv'))
    .pipe(csv.parse({ headers: true }))
    .validate(row => (row.id % 2) === 0)
    .on('readable', () => {
        for (let row = stream.read(); row; row = stream.read()) {
            console.log(`ROW=${JSON.stringify(row)}`);
        }
    })
    .on('end', process.exit);
