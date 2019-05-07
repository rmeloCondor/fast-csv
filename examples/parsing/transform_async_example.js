const fs = require('fs');
const path = require('path');
const csv = require('../../');
const User = require('../models/user');

fs.createReadStream(path.resolve(__dirname, '../assets', 'snake_case_users.csv'))
    .pipe(csv.parse({ headers: true }))
    .transform((row, next) => {
        User.findById(row.id, (err, user) => {
            if (err) {
                return next(err);
            }
            return next(null, `User=${JSON.stringify(user)}\nrow=${JSON.stringify(row)}\n\n`);
        });
    })
    .pipe(process.stdout)
    .on('end', process.exit);
