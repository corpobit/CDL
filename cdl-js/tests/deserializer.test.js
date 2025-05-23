const { CDLDeserializer } = require('../cdl_deserializer.js');

describe('CDL Deserializer', () => {
    let deserializer;

    beforeEach(() => {
        deserializer = new CDLDeserializer();
    });

    test('Basic Key-Value deserialization', () => {
        const input = '---name|age|city:Alice,30,"New York"---';
        const expected = {
            name: 'Alice',
            age: 30,
            city: 'New York'
        };
        expect(deserializer.deserialize(input)).toEqual(expected);
    });

    test('Nested Object deserialization', () => {
        const input = '---user:(name|age|info:Alice,30,(city|job:"New York",Engineer))---';
        const expected = {
            user: {
                name: 'Alice',
                age: 30,
                info: { city: 'New York', job: 'Engineer' }
            }
        };
        expect(deserializer.deserialize(input)).toEqual(expected);
    });

    test('Array deserialization', () => {
        const input = '---users:[name|age:Alice,30,Bob,25]---';
        const expected = {
            users: [
                { name: 'Alice', age: 30 },
                { name: 'Bob', age: 25 }
            ]
        };
        expect(deserializer.deserialize(input)).toEqual(expected);
    });

    test('should throw error for invalid CDL format', () => {
        expect(() => deserializer.deserialize('invalid')).toThrow('Invalid CDL format');
        expect(() => deserializer.deserialize('---invalid---')).toThrow('Invalid CDL format');
        expect(() => deserializer.deserialize('---name:value---')).toThrow('Invalid CDL format');
    });

    test('should handle empty objects', () => {
        const input = '------';
        const expected = {};
        expect(deserializer.deserialize(input)).toEqual(expected);
    });

    test('should handle nested arrays', () => {
        const input = '---matrix:[[1,2,3],[4,5,6],[7,8,9]]---';
        const expected = {
            matrix: [
                [1, 2, 3],
                [4, 5, 6],
                [7, 8, 9]
            ]
        };
        expect(deserializer.deserialize(input)).toEqual(expected);
    });

    test('should handle escaped characters', () => {
        const input = '---text:"Hello, World!"|path:"C:\\Program Files\\App"---';
        const expected = {
            text: 'Hello, World!',
            path: 'C:\\Program Files\\App'
        };
        expect(deserializer.deserialize(input)).toEqual(expected);
    });
}); 