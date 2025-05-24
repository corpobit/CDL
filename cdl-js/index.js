const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');
const { CDLSerializer, CDLDeserializer, findAllValuesByKey } = require('./cdl');

const serializer = new CDLSerializer();
const deserializer = new CDLDeserializer();

function readCDLFile(filename) {
    const filePath = path.join(__dirname, 'examples', filename);
    return fs.readFileSync(filePath, 'utf8');
}

function printHeader(title) {
    console.log('\n' + chalk.cyan('='.repeat(80)));
    console.log(chalk.cyan(' '.repeat(30) + title));
    console.log(chalk.cyan('='.repeat(80)) + '\n');
}

function printSubsection(title) {
    console.log('\n' + chalk.yellow('-'.repeat(40)));
    console.log(chalk.yellow(title));
    console.log(chalk.yellow('-'.repeat(40)));
}

function createTable(headers, rows, options = {}) {
    const table = new Table({
        head: headers.map(h => chalk.cyan(h)),
        style: { head: [], border: [] },
        ...options
    });
    table.push(...rows);
    return table;
}

function measureSearchTime(data, key) {
    // Warm-up run to avoid cold start bias
    findAllValuesByKey(data, key);
    
    const iterations = 1000; // Run multiple times for more accurate measurement
    let totalTime = 0n;
    let minTime = BigInt(Number.MAX_SAFE_INTEGER);
    let maxTime = 0n;
    
    for (let i = 0; i < iterations; i++) {
        const start = process.hrtime.bigint();
        const results = findAllValuesByKey(data, key);
        const end = process.hrtime.bigint();
        const time = end - start;
        
        totalTime += time;
        if (time < minTime) minTime = time;
        if (time > maxTime) maxTime = time;
        
        if (i === 0) {
            // Store results from first iteration
            var firstResults = results;
        }
    }
    
    const avgTimeInMs = Number(totalTime) / iterations / 1_000_000;
    const minTimeInMs = Number(minTime) / 1_000_000;
    const maxTimeInMs = Number(maxTime) / 1_000_000;
    
    return {
        results: firstResults,
        metrics: {
            avgTime: avgTimeInMs.toFixed(3),
            minTime: minTimeInMs.toFixed(3),
            maxTime: maxTimeInMs.toFixed(3),
            iterations
        }
    };
}

function demonstrateCDL(filename) {
    printHeader(`Analyzing ${filename}`);
    try {
        const cdlContent = readCDLFile(filename);
        const deserialized = deserializer.deserialize(cdlContent);
        
        printSubsection('Key Analysis');
        const performanceSummary = [];
        
        for (const key of ['name', 'email', 'skills']) {
            const { results: found, metrics } = measureSearchTime(deserialized, key);
            if (found.length > 0) {
                console.log(chalk.blue(`\nAll values for key '${key}':`));
                const table = createTable(['Index', 'Value', 'Search Time (avg)'], 
                    found.map((v, i) => [i + 1, JSON.stringify(v), i === 0 ? `${metrics.avgTime}ms` : '']));
                console.log(table.toString());
                
                performanceSummary.push({
                    key,
                    count: found.length,
                    avgTime: metrics.avgTime,
                    minTime: metrics.minTime,
                    maxTime: metrics.maxTime
                });
            }
        }
        
        // Print performance summary
        if (performanceSummary.length > 0) {
            printSubsection('Search Performance Summary');
            const summaryTable = createTable(
                ['Key', 'Results', 'Avg Time (ms)', 'Min Time (ms)', 'Max Time (ms)'],
                performanceSummary.map(summary => [
                    summary.key,
                    summary.count,
                    summary.avgTime,
                    summary.minTime,
                    summary.maxTime
                ])
            );
            console.log(summaryTable.toString());
        }
    } catch (e) {
        console.error(chalk.red('Error during analysis:'), e);
    }
}

function analyzeSensorData(data) {
    printSubsection('Sensor Network Analysis');
    
    const allValues = findAllValuesByKey(data, 'value').filter(v => typeof v === 'number');
    const allTypes = findAllValuesByKey(data, 'type');
    const allLocations = findAllValuesByKey(data, 'location');
    
    console.log(chalk.blue('\nNetwork Statistics:'));
    const statsTable = createTable(['Metric', 'Value'], [
        ['Total Sensors', allTypes.length],
        ['Total Readings', allValues.length],
        ['Unique Locations', new Set(allLocations).size]
    ]);
    console.log(statsTable.toString());
    
    const tempReadings = findAllValuesByKey(data, 'value')
        .filter((v, i) => {
            const types = findAllValuesByKey(data, 'type');
            return typeof v === 'number' && types[i] === 'temperature';
        });
    
    console.log(chalk.blue('\nTemperature Analysis:'));
    const tempTable = createTable(['Metric', 'Value'], [
        ['Average Temperature', (tempReadings.reduce((a, b) => a + b, 0) / tempReadings.length).toFixed(2) + '°C'],
        ['Min Temperature', Math.min(...tempReadings).toFixed(1) + '°C'],
        ['Max Temperature', Math.max(...tempReadings).toFixed(1) + '°C']
    ]);
    console.log(tempTable.toString());
    
    console.log(chalk.blue('\nLocation Coverage:'));
    const locations = new Set(allLocations);
    const locationTable = createTable(['Location', 'Sensors'], 
        Array.from(locations).map(loc => [
            loc,
            allLocations.filter(l => l === loc).length
        ]));
    console.log(locationTable.toString());
    
    console.log(chalk.blue('\nSensor Type Distribution:'));
    const typeCount = {};
    allTypes.forEach(type => typeCount[type] = (typeCount[type] || 0) + 1);
    const typeTable = createTable(['Type', 'Count'], 
        Object.entries(typeCount).map(([type, count]) => [type, count]));
    console.log(typeTable.toString());

    console.log(chalk.blue('\nLatest Readings by Sensor:'));
    const sensors = data.sensor_network.sensors;
    const latestReadingsTable = createTable(
        ['Sensor ID', 'Type', 'Location', 'Latest Value', 'Unit', 'Status'],
        sensors.map(sensor => {
            const readings = sensor.readings;
            const latest = readings[readings.length - 1];
            return [
                sensor.id,
                sensor.type,
                sensor.location,
                latest.value,
                latest.unit,
                sensor.status
            ];
        })
    );
    console.log(latestReadingsTable.toString());
}

printHeader('CDL Search Performance Analysis');
demonstrateCDL('user_profile.cdl');
demonstrateCDL('company_data.cdl');
demonstrateCDL('configuration.cdl');

printHeader('Complex Data Analysis');
const complexData = {
    project: {
        name: "Web Application",
        team: [
            {
                name: "Alice",
                role: "Developer",
                tasks: ["Frontend", "API Integration"],
                skills: ["JavaScript", "React", "Node.js"]
            },
            {
                name: "Bob",
                role: "Designer",
                tasks: ["UI Design", "UX Research"],
                skills: ["Figma", "Photoshop", "Illustrator"]
            }
        ],
        milestones: [
            {
                name: "Phase 1",
                status: "Completed",
                tasks: ["Setup", "Basic Features"]
            },
            {
                name: "Phase 2",
                status: "In Progress",
                tasks: ["Advanced Features", "Testing"]
            }
        ],
        settings: {
            environment: "development",
            features: {
                enabled: ["auth", "api", "dashboard"],
                disabled: ["analytics", "export"]
            }
        }
    }
};

const deserializedComplex = deserializer.deserialize(serializer.serialize(complexData));

printSubsection('Key Analysis');
for (const key of ['name', 'skills']) {
    const { results: found, metrics } = measureSearchTime(deserializedComplex, key);
    if (found.length > 0) {
        console.log(chalk.blue(`\nAll values for key '${key}':`));
        const table = createTable(['Index', 'Value', 'Search Time (avg)'], 
            found.map((v, i) => [i + 1, JSON.stringify(v), i === 0 ? `${metrics.avgTime}ms` : '']));
        console.log(table.toString());
    }
}

demonstrateCDL('sensor_data.cdl');
const sensorData = deserializer.deserialize(readCDLFile('sensor_data.cdl'));
analyzeSensorData(sensorData);

printHeader('Deep Search Analysis');
const deepSearchFiles = [
    'company_data.cdl',
    'sensor_data.cdl',
    'configuration.cdl',
    'user_profile.cdl',
    'long_repetitive.cdl'
];

for (const filename of deepSearchFiles) {
    printSubsection(`Analyzing ${filename}`);
    const cdlContent = readCDLFile(filename);
    const deserialized = deserializer.deserialize(cdlContent);
    
    // Search for keys that are likely to be deeply nested
    const keysToSearch = [
        'name', 'value', 'type', 'status', 'settings', 'config',
        'email', 'skills', 'tasks', 'location', 'data', 'parameters',
        'options', 'metadata', 'properties', 'attributes'
    ];
    const performanceSummary = [];
    
    for (const key of keysToSearch) {
        const { results: found, metrics } = measureSearchTime(deserialized, key);
        if (found.length > 0) {
            console.log(chalk.blue(`\nAll values for key '${key}':`));
            const table = createTable(['Index', 'Value', 'Search Time (avg)'], 
                found.map((v, i) => [i + 1, JSON.stringify(v), i === 0 ? `${metrics.avgTime}ms` : '']));
            console.log(table.toString());
            
            performanceSummary.push({
                key,
                count: found.length,
                avgTime: metrics.avgTime,
                minTime: metrics.minTime,
                maxTime: metrics.maxTime
            });
        }
    }
    
    // Print performance summary for this file
    if (performanceSummary.length > 0) {
        printSubsection('Search Performance Summary');
        const summaryTable = createTable(
            ['Key', 'Results', 'Avg Time (ms)', 'Min Time (ms)', 'Max Time (ms)'],
            performanceSummary.map(summary => [
                summary.key,
                summary.count,
                summary.avgTime,
                summary.minTime,
                summary.maxTime
            ])
        );
        console.log(summaryTable.toString());
    }
}


