const fs = require('fs');
const path = require('path');
const csv = require('../../');

fs.createReadStream(path.resolve(__dirname, '../assets', 'snake_case_users.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform((row) => {
        const json = JSON.stringify({
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            address: row.address,
        });
        return `${json}\n`;
    })
    .pipe(process.stdout)
    .on('end', process.exit);
