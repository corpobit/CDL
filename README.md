# Compact Data Language (CDL) Specification v2.0

## Introduction
Compact Data Language (CDL) is a lightweight, human-readable data serialization format optimized for **big data storage and processing**, where **maximum compactness** is paramount. Designed for applications like data lakes, log files, scientific datasets, and large-scale analytics, CDL minimizes storage size through a space-free syntax and single-character delimiters. Unlike formats for real-time communication (e.g., JSON for APIs), CDL prioritizes reducing data footprint and enabling efficient batch processing, making it ideal for terabyte-scale datasets. CDL supports strings, numbers, booleans, nulls, objects, and arrays, ensuring reliability in big data pipelines.

### Goals
- **Maximum Compactness**: Achieve ~20-30% smaller size than JSON by eliminating spaces and using single-character delimiters (e.g., `|`).
- **Efficient Processing**: Enable fast parsing/serialization for large datasets (e.g., millions of records).
- **Reliability**: Explicit key-value mapping prevents ambiguity.
- **Readability**: Maintain human-readable keys for manual inspection, despite space-free design.
- **Interoperability**: Map cleanly to JSON and big data tools (e.g., Hadoop, Spark).

### Example
```
---users:[name|age:Alice,30,Bob,25]---
```
Maps to JSON:
```json
{
  "users": [
    { "name": "Alice", "age": 30 },
    { "name": "Bob", "age": 25 }
  ]
}
```
CDL is ~36% smaller than minified JSON (35 chars vs. 58 chars) and avoids repetitive type prefixes, critical for big data.

## Syntax

### General Structure
- A CDL document is enclosed between `---` delimiters.
- Content follows: `<meta>:<data>` (no spaces around `:`).
- **Meta**: Keys separated by `|` (no spaces).
- **Data**: Values separated by `,` (no spaces).
- No whitespace is allowed, except within quoted strings, to maximize compactness.

### Grammar (BNF-like)
```
<document> ::= "---" <content> "---"
<content> ::= <meta> ":" <data>
<meta> ::= <key> | <key> "|" <meta>
<key> ::= <word> | '"' <string> '"'
<data> ::= <value> | <value> "," <data>
<value> ::= <string> | <number> | <boolean> | "null" | <object> | <array>
<string> ::= <word> | '"' <escaped_string> '"'
<number> ::= [0-9]+ | [0-9]+\.[0-9]+ | -[0-9]+ | -[0-9]+\.[0-9]+
<boolean> ::= "true" | "false"
<object> ::= "(" <content> ")"
<array> ::= "[" <array_content> "]"
<array_content> ::= <data> | <meta> ":" <data>
<word> ::= [a-zA-Z0-9_-]+
<escaped_string> ::= any character sequence with escaped ", \, \,
```

### Keys
- **Format**:
  - Simple keys: Alphanumeric words (letters, digits, `_`, `-`).
  - Quoted keys: For multi-word or special characters (e.g., `"first name"`).
- **Separator**: `|` (no spaces).
- **Examples**:
  - `name|age`, `user_id|city`.
  - `"first name"|"last name"`.
- **Constraints**:
  - Keys must be unique within a meta section.
  - `|` is reserved, not allowed in unquoted keys.
  - Short keys (e.g., 3-5 chars) are encouraged for compactness.

### Values
CDL supports:
1. **Strings**:
   - Unquoted for simple words: `Alice`, `NewYork`.
   - Quoted for spaces/commas: `"New York"`, `"123,456"`.
   - Escaping: Use `\` for quotes, commas, backslashes (e.g., `"Albany\, NY"`).
2. **Numbers**:
   - Numeric literals: `30` (integer), `3.14` (float), `-42` (negative).
3. **Booleans**:
   - `true`, `false`.
4. **Null**:
   - `null` (valid for any key type).
5. **Objects**:
   - Enclosed in `()`: `(name|age:Alice,30)`.
6. **Arrays**:
   - Enclosed in `[]`: `[Alice,Bob]` or `[name|age:Alice,30,Bob,25]`.

### Comments
- No comments in v2.0 to maximize compactness.

### Whitespace
- No spaces allowed, except within quoted strings (e.g., `"New York"`).
- Leading/trailing whitespace within `---` is ignored.
- **Rationale**: Spaces add ~10% overhead, unacceptable for big data.

## Semantics
- **Key-Value Mapping**: Each key in `<meta>` maps to a value in `<data>`, in order.
- **Arrays**:
  - Format: `[meta:data]` groups values into sets of N (N = number of keys), each mapped to an object.
  - Example: `[name|age:Alice,30,Bob,25]` → `[{name:"Alice", age:30}, {name:"Bob", age:25}]`.
- **Empty Values**: An empty value (e.g., `name|age:Alice,`) is parsed as `null`.
- **Duplicate Keys**: Invalid; parsers raise an error.

## Examples

### Basic Key-Value
```
---name|age|city:Alice,30,"New York"---
```
JSON:
```json
{ "name": "Alice", "age": 30, "city": "New York" }
```
- Size: 37 chars vs. 46 chars (minified JSON).

### Nested Object
```
---user:(name|age|info:Alice,30,(city|job:"New York",Engineer))---
```
JSON:
```json
{
  "user": {
    "name": "Alice",
    "age": 30,
    "info": { "city": "New York", "job": "Engineer" }
  }
}
```
- Size: 61 chars vs. 94 chars (minified JSON).

### Array
```
---users:[name|age:Alice,30,Bob,25]---
```
JSON:
```json
{
  "users": [
    { "name": "Alice", "age": 30 },
    { "name": "Bob", "age": 25 }
  ]
}
```
- Size: 35 chars vs. 58 chars (minified JSON).

## Parser Guidelines
Parsers should:
- Validate `---` delimiters.
- Parse typed keys (e.g., `n:age`, `t:date:created`) and apply types to values.
- Ensure metadata and data counts match (e.g., 3 keys → 3 values).
- Handle escaping in quoted strings (e.g., `\"`, `\,`).
- Support recursive parsing for objects `()` and arrays `[]`.
- Optimize for speed to process large datasets (e.g., millions of records).
- Raise clear errors for:
  - Duplicate keys.
  - Unbalanced `()`, `[]`.
  - Type mismatches (e.g., `n:age:abc`).
  - Missing `:` or mismatched key-value counts.
- Represent custom types as `{ "type": "<type_name>", "value": <parsed_value> }` unless custom handlers are provided.

### Example Parser Logic (Python Pseudocode)
```python
def parse_cdl(data):
    if not (data.startswith('---') and data.endswith('---')):
        raise ValueError("Invalid delimiters")
    content = data[3:-3].strip()
    metadata, data_part = content.split(':', 1)
    keys, types = parse_metadata(metadata)
    values = parse_data(data_part, types)
    if len(keys) != len(values):
        raise ValueError(f"Expected {len(keys)} values, found {len(values)}")
    return dict(zip(keys, values))

def parse_metadata(metadata):
    keys = []
    types = []
    i = 0
    while i < len(metadata):
        if metadata[i] in ('n', 'b') and i + 1 < len(metadata) and metadata[i + 1] == ':':
            type_prefix = metadata[i:i + 2]
            i += 2
        elif metadata[i] == 't' and i + 1 < len(metadata) and metadata[i + 1] == ':':
            i += 2
            type_name = ''
            while i < len(metadata) and metadata[i] != ':':
                type_name += metadata[i]
                i += 1
            i += 1
            type_prefix = f't:{type_name}:'
        else:
            type_prefix = ''
        if i < len(metadata) and metadata[i] == '"':
            i += 1
            key = ''
            while i < len(metadata) and metadata[i] != '"':
                if metadata[i] == '\\':
                    i += 1
                key += metadata[i]
                i += 1
            i += 1
        else:
            key = ''
            while i < len(metadata) and metadata[i] not in '|':
                key += metadata[i]
                i += 1
        keys.append(key)
        types.append(type_prefix)
        if i < len(metadata) and metadata[i] == '|':
            i += 1
    return keys, types

def parse_data(data, types):
    values = []
    i = 0
    current = ''
    in_quotes = False
    paren_depth = 0
    bracket_depth = 0
    while i < len(data):
        if data[i] == '"' and data[i - 1] != '\\':
            in_quotes = not in_quotes
            current += data[i]
            i += 1
        elif data[i] == '(' and not in_quotes:
            paren_depth += 1
            current += data[i]
            i += 1
        elif data[i] == ')' and not in_quotes:
            paren_depth -= 1
            current += data[i]
            i += 1
        elif data[i] == '[' and not in_quotes:
            bracket_depth += 1
            current += data[i]
            i += 1
        elif data[i] == ']' and not in_quotes:
            bracket_depth -= 1
            current += data[i]
            i += 1
        elif data[i] == ',' and not in_quotes and paren_depth == 0 and bracket_depth == 0:
            values.append(current.strip())
            current = ''
            i += 1
        else:
            current += data[i]
            i += 1
    if current.strip():
        values.append(current.strip())
    return [parse_value(v, t) for v, t in zip(values, types * (len(values) // len(types)))]

def parse_value(val, type_prefix):
    if not val or val == 'null':
        return None
    if type_prefix == 'n:':
        try:
            return float(val)
        except ValueError:
            raise ValueError(f"Invalid number: {val}")
    elif type_prefix == 'b:':
        if val not in ('true', 'false'):
            raise ValueError(f"Invalid boolean: {val}")
        return val == 'true'
    elif type_prefix.startswith('t:'):
        type_name = type_prefix[2:-1]
        return {'type': type_name, 'value': parse_value(val, '')}
    elif val.startswith('('):
        return parse_cdl('---' + val[1:-1] + '---')
    elif val.startswith('['):
        metadata, data = val[1:-1].split(':', 1) if ':' in val[1:-1] else ('', val[1:-1])
        if metadata:
            keys, types = parse_metadata(metadata)
            values = parse_data(data, types)
            return [dict(zip(keys, values[i:i + len(keys)])) for i in range(0, len(values), len(keys))]
        return parse_data(val[1:-1], [''] * len(val[1:-1].split(',')))
    else:
        return val.strip('"') if type_prefix == '' else val
```

## Interoperability
- **JSON Mapping**:
  - Strings, numbers, booleans, nulls, objects, arrays map directly.
  - Custom types map to `{ "type": "<type_name>", "value": <value> }` unless handled.
- **Big Data Tools**: Compatible with Hadoop, Spark, or Parquet via JSON conversion or native CDL parsers.
- **Type Preservation**: Ensure `n:age:30` → JSON `30` (number), not `"30"` (string).

System: * Today's date and time is 10:16 PM CEST on Monday, May 19, 2025.
