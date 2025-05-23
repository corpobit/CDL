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

function demonstrateCDL(filename) {
    printHeader(`Demonstrating ${filename}`);
    try {
        const cdlContent = readCDLFile(filename);
        console.log(chalk.green('CDL Content:'));
        console.log(chalk.gray(cdlContent));
        
        const deserialized = deserializer.deserialize(cdlContent);
        console.log(chalk.green('\nDeserialized Object:'));
        console.log(JSON.stringify(deserialized, null, 2));
        
        printSubsection('Key Analysis');
        for (const key of ['name', 'email', 'skills']) {
            const found = findAllValuesByKey(deserialized, key);
            if (found.length > 0) {
                console.log(chalk.blue(`\nAll values for key '${key}':`));
                const table = createTable(['Index', 'Value'], 
                    found.map((v, i) => [i + 1, JSON.stringify(v)]));
                console.log(table.toString());
            }
        }
        
        const serialized = serializer.serialize(deserialized);
        console.log(chalk.green('\nReserialized CDL:'));
        console.log(chalk.gray(serialized));
        
        console.log(chalk.green('\nRound-trip verification:'));
        console.log(chalk.yellow('Original and reserialized match:'), 
            cdlContent === serialized ? chalk.green('✓') : chalk.red('✗'));
    } catch (e) {
        console.error(chalk.red('Error during demonstration:'), e);
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

printHeader('CDL Serialization/Deserialization Examples');
å
demonstrateCDL('user_profile.cdl');
demonstrateCDL('company_data.cdl');
demonstrateCDL('configuration.cdl');
demonstrateCDL('test_cpp.cdl');

printHeader('Complex Example');
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

console.log(chalk.green('Original Object:'));
console.log(JSON.stringify(complexData, null, 2));

const serializedComplex = serializer.serialize(complexData);
console.log(chalk.green('\nSerialized CDL:'));
console.log(chalk.gray(serializedComplex));

const deserializedComplex = deserializer.deserialize(serializedComplex);
console.log(chalk.green('\nDeserialized Object:'));
console.log(JSON.stringify(deserializedComplex, null, 2));

printSubsection('Key Analysis');
for (const key of ['name', 'skills']) {
    const found = findAllValuesByKey(deserializedComplex, key);
    if (found.length > 0) {
        console.log(chalk.blue(`\nAll values for key '${key}':`));
        const table = createTable(['Index', 'Value'], 
            found.map((v, i) => [i + 1, JSON.stringify(v)]));
        console.log(table.toString());
    }
}

console.log(chalk.green('\nRound-trip verification:'));
console.log(chalk.yellow('Objects match:'), 
    JSON.stringify(complexData) === JSON.stringify(deserializedComplex) ? chalk.green('✓') : chalk.red('✗'));

demonstrateCDL('long_repetitive.cdl');

demonstrateCDL('sensor_data.cdl');
const sensorData = deserializer.deserialize(readCDLFile('sensor_data.cdl'));
analyzeSensorData(sensorData);


