const csv = require('../');

const data = [
    { a: 'a1', b: 'b1' },
    { a: 'a2', b: 'b2' },
];

const transform = row => ({
    A: row.a,
    B: row.b,
});

csv
    .writeToString(data, { headers: true, transform })
    .then((formattedCsv) => {
        console.log(formattedCsv);
        process.exit();
    })
    .catch((err) => {
        console.error(err.stack);
        process.exit(1);
    });
