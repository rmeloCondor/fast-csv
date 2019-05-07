const ParserContext = require('../lib/parser/parser/ParserContext');
const { ColumnParser } = require('../lib/parser/parser/column');
const Scanner = require('../lib/parser/parser/Scanner');

const parserContext = new ParserContext({});
const columnParser = new ColumnParser({ parserContext });

const runBenchmark = (line, count, hasMoreData, parser) => {
    const start = new Date();
    for (let i = 0; i < count; i += 1) {
        parser.parse(new Scanner({ line, parserContext, hasMoreData }));
    }
    return new Date() - start;
};

const columns = 4;
const rows = 100000;

const doColumnBenchmark = (column, hasMoreData, runs) => {
    let sum = 0;
    const count = columns * rows;
    for (let i = 0; i < runs; i += 1) {
        const duration = runBenchmark(column, count, hasMoreData, columnParser);
        console.log(`${column} parse duration ${duration}ms`);
        sum += duration;
    }
    console.log(`${column} AVG duration = ${sum / runs}`);
};


const runs = 3;
console.log('Parse Column Benchmark hasMoreData = true');
doColumnBenchmark('HELLO ,', true, runs);
doColumnBenchmark('"HELLO ",', true, runs);
doColumnBenchmark('"H""E""LL""O"" ",', true, runs);

console.log('\nBenchmark hasMoreData = false');
doColumnBenchmark('HELLO ,', false, runs);
doColumnBenchmark('"HELLO ",', false, runs);
doColumnBenchmark('"H""E""LL""O"" ",', false, runs);
