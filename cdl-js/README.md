# CDL-JS

A JavaScript implementation of the Compact Data Language (CDL) specification. CDL is a lightweight, human-readable data serialization format optimized for big data storage and processing.

## Specification

CDL is designed with a unique structure that makes it particularly efficient for both storage and searching. The format's design principles focus on:

1. **Key-Value Organization**
   - Keys are grouped together at the start of each object (`name|age|city:`)
   - Values follow in the same order as their corresponding keys
   - This organization allows for quick key lookup and value association

2. **Compact Representation**
   - Minimal use of delimiters (only `---`, `|`, `:`, `,`, `(`, `)`, `[`, `]`)
   - No whitespace (except in quoted strings)
   - Results in ~20-30% smaller size compared to JSON

3. **Hierarchical Design**
   - Nested structures use parentheses `()` for objects and brackets `[]` for arrays
   - Clear visual separation between different levels of nesting
   - Makes it easy to traverse the structure programmatically

4. **Search Optimization**
   - Keys are always at the beginning of each object
   - Strict rules make parsing deterministic
   - Compact representation means less memory usage
   - Better cache utilization due to data locality

### Format Rules

1. **Object Structure**
   ```
   ---key1|key2|key3:value1,value2,value3---
   ```

2. **Nested Objects**
   ```
   ---key1:(nestedKey1|nestedKey2:nestedValue1,nestedValue2)---
   ```

3. **Arrays**
   ```
   ---key:[value1,value2,value3]---
   ```

4. **Arrays of Objects**
   ```
   ---key:[objKey1|objKey2:value1,value2,value3,value4]---
   ```

### Type Support

- Strings: `name:"Alice"` (quotes required for strings with special characters)
- Numbers: `age:30`
- Booleans: `active:true`
- Null: `value:null`
- Objects: `(key|value:name,42)`
- Arrays: `[name|age:Alice,30,Bob,25]`

### String Escaping

The following characters need to be escaped with a backslash in strings:
- Double quotes: `\"`
- Colons: `\:`
- Commas: `\,`
- Backslashes: `\\`

Example:
```javascript
const obj = {
    name: "John \"The Rock\" Smith",
    path: "C:\\Program Files\\App"
};
// CDL: ---name|path:"John \"The Rock\" Smith","C:\\Program Files\\App"---
```

## Features

- Maximum compactness (~20-30% smaller than JSON)
- Efficient processing for large datasets
- Support for all basic types (strings, numbers, booleans, nulls)
- Support for objects and arrays
- No whitespace (except in quoted strings)
- Human-readable keys
- Smart handling of arrays of objects with shared keys

## Installation

```bash
npm install cdl-js
```

## Usage

You can use the library in two ways:

### Using the CDL class

```javascript
const CDL = require('cdl-js');

// Serialize an object to CDL
const obj = {
    name: "Alice",
    age: 30,
    city: "New York"
};
const cdl = CDL.serialize(obj);
console.log(cdl);
// Output: ---name|age|city:Alice,30,"New York"---

// Deserialize CDL to an object
const parsed = CDL.deserialize(cdl);
console.log(parsed);
// Output: { name: 'Alice', age: 30, city: 'New York' }
```

### Using convenience functions

```javascript
const { stringify, parse } = require('cdl-js');

// Serialize an object to CDL
const obj = {
    name: "Alice",
    age: 30,
    city: "New York"
};
const cdl = stringify(obj);
console.log(cdl);
// Output: ---name|age|city:Alice,30,"New York"---

// Deserialize CDL to an object
const parsed = parse(cdl);
console.log(parsed);
// Output: { name: 'Alice', age: 30, city: 'New York' }
```

## Examples

### Basic Key-Value
```javascript
const obj = {
    name: "Alice",
    age: 30,
    city: "New York"
};
// CDL: ---name|age|city:Alice,30,"New York"---
```

### Nested Object
```javascript
const obj = {
    user: {
        name: "Alice",
        age: 30,
        info: {
            city: "New York",
            job: "Engineer"
        }
    }
};
// CDL: ---user:(name|age|info:Alice,30,(city|job:"New York",Engineer))---
```

### Array
```javascript
const obj = {
    users: [
        { name: "Alice", age: 30 },
        { name: "Bob", age: 25 }
    ]
};
// CDL: ---users:[name|age:Alice,30,Bob,25]---
```

### Empty Object
```javascript
const obj = {};
// CDL: ------
```

## Error Handling

The deserializer will throw errors in the following cases:
- Invalid CDL format (missing `---` delimiters)
- Mismatched keys and values
- Invalid nested structure
- Unclosed quotes or brackets

## License

MIT

## Efficient Search Mechanism

The CDL library implements a highly efficient recursive search mechanism through the `findAllValuesByKey` function. This function provides a powerful way to search through nested objects and arrays to find all values associated with a specific key.

### Key Features

1. **Deep Recursive Search**: The function traverses through all levels of nested objects and arrays, ensuring no value is missed regardless of how deeply it's nested.

2. **Array Support**: Handles both object and array structures, making it versatile for various data structures.

3. **Memory Efficient**: Uses a recursive approach that processes one node at a time, making it memory efficient even for large data structures.

4. **Time Complexity**: The search is performed in O(n) time complexity, where n is the total number of nodes in the data structure.

### Example Usage

```javascript
const { findAllValuesByKey } = require('./cdl');

const data = {
    user: {
        name: "John",
        addresses: [
            { city: "New York", country: "USA" },
            { city: "London", country: "UK" }
        ]
    }
};

// Find all cities
const cities = findAllValuesByKey(data, 'city');
// Result: ["New York", "London"]
```

### Performance Benefits

1. **Single Pass**: The algorithm makes a single pass through the data structure, collecting all matching values.

2. **No Preprocessing**: Unlike some search implementations that require preprocessing or indexing, this mechanism works directly on the data structure.

3. **Minimal Memory Overhead**: Only stores the results array, making it memory efficient.

4. **Flexible**: Works with any level of nesting and any combination of objects and arrays.

### Use Cases

- Finding all instances of a specific field in a complex JSON structure
- Extracting all values of a particular type from nested data
- Data validation and verification
- Data transformation and extraction

This search mechanism is particularly useful when dealing with complex nested data structures where you need to find all occurrences of a specific key, regardless of where it appears in the structure. 