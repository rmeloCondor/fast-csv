const ParserContext = require('../lib/parser/parser/ParserContext');
const { RowParser } = require('../lib/parser/parser/row');
const Scanner = require('../lib/parser/parser/Scanner');

const parserContext = new ParserContext({});
const rowParser = new RowParser(parserContext, {});

const runBenchmark = (line, count, hasMoreData, parser) => {
    const start = new Date();
    for (let i = 0; i < count; i += 1) {
        parser.parse(new Scanner({ line, parserContext, hasMoreData }));
    }
    return new Date() - start;
};

const rows = 100000;

const doRowBenchmark = (row, hasMoreData, runs) => {
    let sum = 0;
    for (let i = 0; i < runs; i += 1) {
        const duration = runBenchmark(row, rows, hasMoreData, rowParser);
        console.log(`${row.replace(/\n/, '\\n')} parse duration ${duration}ms`);
        sum += duration;
    }
    console.log(`${row} AVG duration = ${sum / runs}`);
};

const runs = 3;
console.log('Parse Row Benchmark hasMoreData = true');
doRowBenchmark('HELLO,WORLD,FOO,BAR\n', true, runs);
doRowBenchmark('"HELLO ","WORLD", "FOO","BAR"\n', true, runs);
doRowBenchmark('"H""E""LL""O"" ","WORLD", """FOO""", "BAR"""\n', true, runs);

console.log('\nBenchmark hasMoreData = false');
doRowBenchmark('HELLO,WORLD,FOO,BAR\n', false, runs);
doRowBenchmark('"HELLO ","WORLD", "FOO","BAR"\n', false, runs);
doRowBenchmark('"H""E""LL""O"" ","WORLD", """FOO""", "BAR"""\n', false, runs);
