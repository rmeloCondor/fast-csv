const fs = require('fs');
const path = require('path');
const csv = require('../../');
const User = require('../models/user');

const stream = fs.createReadStream(path.resolve(__dirname, '../assets', 'snake_case_users.csv'))
    .pipe(csv.parse({ headers: true }))
    .validate((row, next) => {
        User.findById(row.id, (err, user) => {
            if (err) {
                return next(err);
            }
            return next(null, user.isVerified);
        });
    })
    .on('readable', () => {
        for (let row = stream.read(); row; row = stream.read()) {
            console.log(`User=${JSON.stringify(row)}`);
        }
    })
    .on('end', process.exit);
