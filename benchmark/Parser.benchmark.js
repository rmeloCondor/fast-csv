const assert = require('assert');
const ParserContext = require('../lib/parser/parser/ParserContext');
const { ColumnParser } = require('../lib/parser/parser/column');
const { RowParser } = require('../lib/parser/parser/row');
const { Parser } = require('../lib/parser/parser');
const Scanner = require('../lib/parser/parser/Scanner');

const parserContext = new ParserContext({});
const parser = new Parser({});

const runBenchmark = (line, count, hasMoreData) => {
    const start = new Date();
    parser.parse(line, hasMoreData);
    return new Date() - start;
};

const rows = 100000;


const doBenchmark = (line, hasMoreData, runs) => {
    let sum = 0;
    let lineData = '';
    for (let rowNum = 0; rowNum <= rows; rowNum += 1) {
        lineData += line;
    }
    for (let i = 0; i < runs; i += 1) {
        const duration = runBenchmark(lineData, rows, hasMoreData);
        console.log(`${line.replace(/\n/, '\\n')} parse duration ${duration}ms`);
        sum += duration;
    }
    console.log(`${line} AVG duration = ${sum / runs}`);
};


const runs = 3;

console.log('Parse  Benchmark hasMoreData = true');
doBenchmark('HELLO,WORLD,FOO,BAR\n', true, runs);
doBenchmark('"HELLO ","WORLD", "FOO","BAR"\n', true, runs);
doBenchmark('"H""E""LL""O"" ","WORLD", """FOO""", "BAR"""\n', true, runs);

console.log('\nBenchmark hasMoreData = false');
doBenchmark('HELLO,WORLD,FOO,BAR\n', false, runs);
doBenchmark('"HELLO ","WORLD", "FOO","BAR"\n', false, runs);
doBenchmark('"H""E""LL""O"" ","WORLD", """FOO""", "BAR"""\n', false, runs);
