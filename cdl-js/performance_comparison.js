const { CDLSerializer, CDLDeserializer } = require('./cdl');
const fs = require('fs');
const Table = require('cli-table3');

const serializer = new CDLSerializer();
const deserializer = new CDLDeserializer();

// Generate large data: 100,000 records
function generateBigData(n = 100000) {
    const arr = [];
    for (let i = 0; i < n; i++) {
        arr.push({
            id: i,
            name: `User${i}`,
            age: 20 + (i % 50),
            email: `user${i}@example.com`,
            active: i % 2 === 0,
            scores: [Math.random() * 100, Math.random() * 100, Math.random() * 100],
            meta: {
                created: Date.now() - (i * 1000),
                tags: [`tag${i % 10}`, `tag${(i + 1) % 10}`]
            }
        });
    }
    return { users: arr };
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function measure(label, fn) {
    const start = process.hrtime.bigint();
    const result = fn();
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;
    return { result, ms };
}

function printTable(rows) {
    const table = new Table({
        head: ['Format', 'Serialize (ms)', 'Deserialize (ms)', 'Size'],
        style: { head: [], border: [] }
    });
    table.push(...rows);
    console.log(table.toString());
}

console.log('Generating big data...');
const bigData = generateBigData(100000);

console.log('Testing JSON...');
const jsonSer = measure('JSON serialize', () => JSON.stringify(bigData));
const jsonDes = measure('JSON deserialize', () => JSON.parse(jsonSer.result));
const jsonSize = Buffer.byteLength(jsonSer.result, 'utf8');

console.log('Testing CDL...');
const cdlSer = measure('CDL serialize', () => serializer.serialize(bigData));
const cdlDes = measure('CDL deserialize', () => deserializer.deserialize(cdlSer.result));
const cdlSize = Buffer.byteLength(cdlSer.result, 'utf8');

printTable([
    ['JSON', jsonSer.ms.toFixed(2), jsonDes.ms.toFixed(2), formatBytes(jsonSize)],
    ['CDL', cdlSer.ms.toFixed(2), cdlDes.ms.toFixed(2), formatBytes(cdlSize)]
]);

// Optionally, write the outputs to files for inspection
// fs.writeFileSync('bigdata.json', jsonSer.result);
// fs.writeFileSync('bigdata.cdl', cdlSer.result); 