

const { CDLSerializer } = require('../cdl_serializer.js');

describe('CDL Serializer', () => {
    let serializer;

    beforeEach(() => {
        serializer = new CDLSerializer();
    });
  
    test('Basic Key-Value serialization', () => {
        const test1 = {
            name: 'Alice',
            age: 30,
            city: 'New York'
        };
        const expected = '---name|age|city:Alice,30,"New York"---';
        expect(serializer.serialize(test1)).toBe(expected);
    });

    test('Nested Object serialization', () => {
        const test2 = {
            user: {
                name: 'Alice',
                age: 30,
                info: { city: 'New York', job: 'Engineer' }
            }
        };
        const expected = '---user:(name|age|info:Alice,30,(city|job:"New York",Engineer))---';
        expect(serializer.serialize(test2)).toBe(expected);
    });

    test('Array serialization', () => {
        const test3 = {
            users: [
                { name: 'Alice', age: 30 },
                { name: 'Bob', age: 25 }
            ]
        };
        const expected = '---users:[name|age:Alice,30,Bob,25]---';
        expect(serializer.serialize(test3)).toBe(expected);
    });

    test('should throw error for non-object root', () => {
        expect(() => serializer.serialize('not an object')).toThrow('Root must be an object');
        expect(() => serializer.serialize(null)).toThrow('Root must be an object');
    });
});