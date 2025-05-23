# CDL-JS

A JavaScript implementation of the Compact Data Language (CDL) specification. CDL is a lightweight, human-readable data serialization format optimized for big data storage and processing.

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

## Type Support

- Strings: `name:"Alice"` (quotes required for strings with special characters)
- Numbers: `age:30`
- Booleans: `active:true`
- Null: `value:null`
- Objects: `(key|value:name,42)`
- Arrays: `[name|age:Alice,30,Bob,25]`

## String Escaping

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

## Error Handling

The deserializer will throw errors in the following cases:
- Invalid CDL format (missing `---` delimiters)
- Mismatched keys and values
- Invalid nested structure
- Unclosed quotes or brackets

## License

MIT 