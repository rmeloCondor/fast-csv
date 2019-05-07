const csv = require('csv');
const path = require('path');
const fs = require('fs');
const fastCsv = require('../lib');


function camelize(str) {
    return str.replace(/_(.)/g, (a, b) => b.toUpperCase());
}

function benchmarkFastCsv(num, done) {
    let count = 0;
    const file = path.resolve(__dirname, `./assets/${num}.csv`);
    fastCsv
        .fromPath(file, { headers: true })
        .transform((data) => {
            const ret = {};
            [ 'first_name', 'last_name', 'email_address' ].forEach((prop) => {
                ret[camelize(prop)] = data[prop];
            });
            ret.address = data.address;
            return ret;
        })
        .on('data', () => {
            count += 1;
        })
        .on('end', (rowCount) => {
            if (rowCount !== num) {
                done(new Error(`Error expected ${num} got ${rowCount}`));
            } else {
                done();
            }
        })
        .on('error', (error) => {
            done(error);
        });
}

function benchmarkCsv(num, done) {
    let count = 0;
    const file = path.resolve(__dirname, `./assets/${num}.csv`);
    fs.createReadStream(file)
        .pipe(csv.parse({ columns: true }))
        .pipe(csv.transform((data) => {
            const ret = {};
            [ 'first_name', 'last_name', 'email_address' ].forEach((prop) => {
                ret[camelize(prop)] = data[prop];
            });
            ret.address = data.address;
            return ret;
        }))
        .on('data', (data) => {
            count++;
        })
        .on('end', () => {
            if (count !== num) {
                done(new Error(`Error expected ${num} got ${count}`));
            } else {
                done();
            }
        })
        .on('error', (error) => {
            console.log(error.message);
        });
}

function benchmarkRun(title, num, m, done) {
    const start = new Date(); let
        runStart = start;
    m(num, (err) => {
        if (err) {
            done(err);
        } else {
            console.log('%s: RUN(%d lines) 1 %dms', title, num, (new Date() - runStart));
            runStart = new Date();
            m(num, (err) => {
                if (err) {
                    done(err);
                } else {
                    console.log('%s: RUN(%d lines) 2 %dms', title, num, (new Date() - runStart));
                    runStart = new Date();
                    m(num, (err) => {
                        if (err) {
                            done(err);
                        } else {
                            console.log('%s: RUN(%d lines) 3 %dms', title, num, (new Date() - runStart));
                            console.log('%s: 3xAVG for %d lines %dms', title, num, (new Date() - start) / 3);
                            done();
                        }
                    });
                }
            });
        }
    });
}

function runBenchmarks(num, cb) {
    console.log('RUNNING %d.csv benchmarks', num);
    benchmarkRun('fast-csv', num, benchmarkFastCsv, (err) => {
        if (err) {
            cb(err);
        } else {
            cb()
            // benchmark('csv', num, benchmarkCsv, (err) => {
            //     if (err) {
            //         cb(err);
            //     } else {
            //         console.log('');
            //         cb();
            //     }
            // });
        }
    });
}

function benchmarks(cb) {
    runBenchmarks(20000, function (err) {
        if (err) {
            cb(err);
        } else {
            runBenchmarks(50000, (err) => {
                if (err) {
                    cb(err);
                } else {
                    runBenchmarks(100000, (err) => {
                        if (err) {
                            cb(err);
                        } else {
                            cb(null);
                        }
                    });
                }
            });
        }
    });
};


benchmarks((err) => {
    if(err){
        console.error(err.stack);
        return process.exit(1);
    }
    return process.exit();
});