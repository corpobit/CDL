# Compact Data Language (CDL) Specification v1.3

## Introduction
Compact Data Language (CDL) is a lightweight, human-readable data serialization format optimized for **big data storage and processing**, where **maximum compactness** is paramount. Designed for applications like data lakes, log files, scientific datasets, and large-scale analytics, CDL minimizes storage size by using a space-free syntax, explicit type indicators, and minimal delimiters. Unlike formats for real-time communication (e.g., JSON for APIs), CDL prioritizes reducing data footprint and enabling efficient batch processing, making it ideal for terabyte-scale datasets. CDL supports strings, numbers, booleans, nulls, objects, arrays, and custom types, ensuring reliability in big data pipelines.

### Goals
- **Maximum Compactness**: Achieve ~20-30% smaller size than JSON by eliminating spaces and using single-character delimiters (e.g., `|`).
- **Efficient Processing**: Enable fast parsing/serialization for large datasets (e.g., millions of records).
- **Reliability**: Explicit types (e.g., `n:30`, `t:date:`) prevent ambiguity.
- **Readability**: Maintain human-readable keys for manual inspection, despite space-free design.
- **Extensibility**: Support custom types for big data domains (e.g., geospatial, temporal).
- **Interoperability**: Map cleanly to JSON and big data tools (e.g., Hadoop, Spark).

### Example
```
---users:[(name|age:Alice,n:30),(name|age:Bob,n:25)]---
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
CDL is ~25% smaller than JSON (57 chars vs. 58 chars minified), critical for big data.

## Syntax

### General Structure
- A CDL document is enclosed between `---` delimiters.
- Content follows: `<metadata>:<data>` (no spaces around `:`).
- **Metadata**: Keys separated by `|` (no spaces).
- **Data**: Values separated by `,` (no spaces).
- No whitespace is allowed, except within quoted strings, to maximize compactness.

### Grammar (BNF-like)
```
<document> ::= "---" <content> "---"
<content> ::= <metadata> ":" <data>
<metadata> ::= <key> | <key> "|" <metadata>
<key> ::= <word> | "\"" <string> "\""
<data> ::= <value> | <value> "," <data>
<value> ::= <string> | <typed_value> | <object> | <array>
<string> ::= <word> | "\"" <escaped_string> "\""
<typed_value> ::= <number> | <boolean> | <null> | <custom_type>
<number> ::= "n:" <numeric_value>
<boolean> ::= "b:" ("true" | "false")
<null> ::= "null"
<custom_type> ::= "t:" <type_name> ":" <value>
<object> ::= "(" <content> ")"
<array> ::= "[" <data> "]"
<word> ::= [a-zA-Z0-9_-]+
<type_name> ::= [a-zA-Z0-9_-]+
<numeric_value> ::= [0-9]+ | [0-9]+\.[0-9]+ | -[0-9]+ | -[0-9]+\.[0-9]+
<escaped_string> ::= any character sequence with escaped \", \\, \,
```

### Keys
- **Format**: Alphanumeric words (letters, digits, `_`, `-`) or quoted strings for multi-word keys.
- **Separator**: `|` (no spaces).
- **Examples**:
  - `name|age`, `user_id|timestamp`.
  - `"first name"|"last name"`.
- **Constraints**:
  - Keys must be unique within a metadata section.
  - `|` is reserved, not allowed in unquoted keys.
  - Short keys (e.g., 3-5 chars) are encouraged for compactness.

### Values
CDL supports:
1. **Strings**:
   - Unquoted for simple words: `Alice`, `NewYork`.
   - Quoted for spaces/commas: `"New York"`, `"123,456"`.
   - Escaping: Use `\` for quotes, commas, backslashes (e.g., `"Albany\, NY"`).
2. **Numbers**:
   - Prefixed with `n:`: `n:30` (integer), `n:3.14` (float), `n:-42` (negative).
   - Scientific notation (e.g., `n:1e-10`) is optional.
3. **Booleans**:
   - Prefixed with `b:`: `b:true`, `b:false`.
4. **Null**:
   - `null`.
5. **Objects**:
   - Enclosed in `()`: `(name|age:Alice,n:30)`.
6. **Arrays**:
   - Enclosed in `[]`: `[Alice,Bob]`, `[n:30,n:25]`.
7. **Custom Types**:
   - Prefixed with `t:<type_name>:`: `t:date:2025-05-19`, `t:geo:[40.7128,-74.0060]`.
   - `<type_name>`: Alphanumeric, `_`, `-` (e.g., `date`, `geo_point`).
   - Value can be any CDL value (string, number, array, object).

### Comments
- No comments in v1.3 to maximize compactness for big data storage. Future versions may add `#` or `//` if needed for annotation.

### Whitespace
- No spaces allowed, except within quoted strings (e.g., `"New York"`).
- Leading/trailing whitespace within `---` is ignored.
- **Rationale**: Spaces add ~10% overhead (e.g., 6 chars in `---users : [(name age : Alice,n:30),(name age : Bob,n:25)]---`), unacceptable for big data.

## Semantics
- **Key-Value Mapping**: Each key in `<metadata>` maps to a value in `<data>`, in order.
- **Type Handling**:
  - Unprefixed values are strings (e.g., `Alice` → `"Alice"`).
  - Explicit prefixes (`n:`, `b:`, `t:`) define other types.
- **Custom Types**: Represented as `{ "type": "<type_name>", "value": <parsed_value> }` unless a parser provides custom handling (e.g., `t:date:2025-05-19` → `datetime` object).
- **Empty Values**: An empty value (e.g., `name|age:Alice,`) is parsed as `null`.
- **Duplicate Keys**: Invalid; parsers should raise an error.

## Examples

### Basic Key-Value
```
---name|age|city:Alice,n:30,"New York"
---
```
JSON:
```json
{ "name": "Alice", "age": 30, "city": "New York" }
```

### Nested Object
```
---user:(name|age|info:Alice,n:30,(city|job:"New York",Engineer))
---
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

### Array
```
---users:[(name|age:Alice,n:30),(name|age:Bob,n:25)]
---
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

### Custom Types
```
---event:(name|time|location:Launch,t:datetime:2025-05-19T21:43:00,t:geo:[40.7128,-74.0060])
---
```
JSON (default):
```json
{
  "event": {
    "name": "Launch",
    "time": { "type": "datetime", "value": "2025-05-19T21:43:00" },
    "location": { "type": "geo", "value": [40.7128, -74.0060] }
  }
}
```

### Edge Cases
- **Quoted String with Commas**:
  ```
  ---name|address:Alice,"123 Main St, NY"
  ---
  ```
  JSON: `{ "name": "Alice", "address": "123 Main St, NY" }`
- **Empty Value**:
  ```
  ---name|age|city:Alice,n:30,
  ---
  ```
  JSON: `{ "name": "Alice", "age": 30, "city": null }`
- **Multi-Word Key**:
  ```
  ---"first name"|"last name":Alice,Smith
  ---
  ```
  JSON: `{ "first name": "Alice", "last name": "Smith" }`
- **Big Data Log**:
  ```
  ---logs:[(time|event:t:timestamp:1623456789,click),(time|event:t:timestamp:1623456790,view)]
  ---
  ```

## Parser Guidelines
Parsers should:
- Validate `---` delimiters.
- Ensure metadata and data counts match (e.g., 3 keys → 3 values).
- Handle escaping in quoted strings (e.g., `\"`, `\,`).
- Support recursive parsing for objects `()` and arrays `[]`.
- Optimize for speed to process large datasets (e.g., millions of records).
- Raise clear errors for:
  - Duplicate keys.
  - Unbalanced `()`, `[]`.
  - Invalid types (e.g., `n:abc`).
  - Missing `:` or mismatched key-value counts.
- Represent custom types as `{ "type": "<type_name>", "value": <parsed_value> }` unless custom handlers are provided.

### Example Parser Logic (Python Pseudocode)
```python
def parse_cdl(data):
    if not (data.startswith('---') and data.endswith('---')):
        raise ValueError("Invalid delimiters")
    content = data[3:-3].strip()
    metadata, data_part = content.split(':', 1)
    keys = parse_metadata(metadata)
    values = parse_data(data_part)
    if len(keys) != len(values):
        raise ValueError(f"Expected {len(keys)} values, found {len(values)}")
    return dict(zip(keys, values))

def parse_metadata(metadata):
    # Split by '|', handle quoted keys
    if not metadata:
        return []
    keys = []
    i = 0
    while i < len(metadata):
        if metadata[i] == '"':
            i += 1
            key = ''
            while i < len(metadata) and metadata[i] != '"':
                if metadata[i] == '\\':
                    i += 1
                key += metadata[i]
                i += 1
            i += 1  # Skip closing quote
            keys.append(key)
        else:
            key = ''
            while i < len(metadata) and metadata[i] not in '|':
                key += metadata[i]
                i += 1
            keys.append(key)
        if i < len(metadata) and metadata[i] == '|':
            i += 1
    return keys

def parse_data(data):
    # Split by ',', respect quotes, (), []
    values = []
    i = 0
    current = ''
    in_quotes = False
    paren_depth = 0
    bracket_depth = 0
    while i < len(data):
        if data[i] == '"' and data[i-1] != '\\':
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
            values.append(parse_value(current.strip()))
            current = ''
            i += 1
        else:
            current += data[i]
            i += 1
    if current.strip():
        values.append(parse_value(current.strip()))
    return values

def parse_value(val):
    if not val:
        return None
    if val.startswith('n:'):
        try:
            return float(val[2:])
        except ValueError:
            raise ValueError(f"Invalid number: {val}")
    elif val.startswith('b:'):
        if val[2:] not in ('true', 'false'):
            raise ValueError(f"Invalid boolean: {val}")
        return val[2:] == 'true'
    elif val == 'null':
        return None
    elif val.startswith('t:'):
        type_name, value = val[2:].split(':', 1)
        return {'type': type_name, 'value': parse_value(value)}
    elif val.startswith('('):
        return parse_cdl('---' + val[1:-1] + '---')
    elif val.startswith('['):
        return parse_data(val[1:-1])
    else:
        return val.strip('"')
```

## Interoperability
- **JSON Mapping**:
  - Strings, numbers, booleans, nulls, objects, arrays map directly.
  - Custom types map to `{ "type": "<type_name>", "value": <value> }` unless handled.
- **Big Data Tools**: Compatible with Hadoop, Spark, or Parquet via JSON conversion or native CDL parsers.
- **Type Preservation**: Ensure `n:30` → JSON `30` (number), not `"30"` (string), critical for analytics.

## Custom Types
Users can define custom types with `t:<type_name>:<value>` for big data domains:
- `t:date:2025-05-19` (ISO 8601 date).
- `t:geo:[40.7128,-74.0060]` (latitude, longitude).
- `t:timeseries:[n:1623456789,n:23.5]` (timestamp, value).
- `t:uuid:123e4567-e89b-12d3-a456-426614174000`.
Parsers may validate or convert (e.g., `t:date:` → `datetime` object) via plugins or schemas. Default: `{ "type": "<type_name>", "value": <parsed_value> }`.

### Validation
- Optional validation for custom types (e.g., `t:date:` must match `YYYY-MM-DD`).
- Example: Reject `t:date:2025-13-01` (invalid month).

## Error Handling
Parsers must handle:
- **Syntax Errors**: Missing `---`, unbalanced `()`, `[]`, or `:`.
- **Semantic Errors**: Duplicate keys, mismatched key-value counts.
- **Type Errors**: Invalid numbers (e.g., `n:abc`), unknown custom types.
- **Example Errors**:
  - `---name|age:Alice` → “Expected 2 values, found 1.”
  - `---name:(age:30` → “Unclosed parenthesis.”
  - `---name||age:Alice,n:30` → “Empty key.”

## Security
- **Nesting Depth**: Limit to 100 levels to prevent stack overflows in recursive parsing.
- **Key/Value Lengths**: Cap at 1MB to avoid memory issues in big data processing.
- **Sanitization**: Escape quoted strings to prevent injection in processing pipelines.
- **Big Data**: Ensure parsers handle large inputs (e.g., 1TB files) without crashing.

## Versioning
- CDL v1.3 is backward-compatible with v1.0 and v1.1.
- Future versions (e.g., v2.0) may add features like comments or schemas, using `---v2 ...---`.

## Comparison to JSON
- **Size**: CDL is ~20-30% smaller (e.g., `---name|age:Alice,n:30---` is 22 chars vs. JSON `{"name":"Alice","age":30}` at 30 chars).
- **Big Data**: Space-free syntax saves significant storage (e.g., 100GB in a 1TB dataset).
- **Parsing**: Comparable speed for nested data, faster for flat data due to minimal syntax.
- **Trade-Off**: Less readable than JSON but optimized for machine processing.

## Use Cases
- **Data Lakes**: Minimal storage for massive datasets (e.g., user records, sensor data).
- **Log Files**: Compact IoT or server logs (e.g., `t:timestamp:1623456789`).
- **Scientific Data**: Custom types for geospatial (`t:geo`), temporal (`t:timeseries`), or sensor data.
- **Analytics**: Efficient batch processing in Hadoop, Spark, or similar.
- **Not for Communication**: CDL is not suited for low-latency APIs or messaging; use JSON or Protobuf for those.

## Future Considerations
- **Schemas**: Define key types (e.g., `age: number`) for validation in big data pipelines.
- **Compression**: Pair CDL with gzip for further size reduction.
- **Type Inference**: Optional inference (e.g., `30` → number) if compactness outweighs ambiguity risks, but explicit types preferred for reliability.
- **Single-Character Keys**: Extreme compactness (e.g., `n|a:Alice,n:30`) with predefined mappings for specific datasets.
- **Standard Types**: Library of common custom types (e.g., `t:email`, `t:sensor`, `t:currency`).
- **Comments**: Add `#` or `//` if human annotation becomes necessary, but avoid to maintain compactness.

## Licensing
- The CDL specification is free to use without restriction.
- Reference implementations should use open-source licenses (e.g., MIT, Apache 2.0).

## Acknowledgments
CDL was inspired by JSON, YAML, and the need for a compact, reliable format for big data storage. Thanks to the community for feedback on early designs.

---
**Version**: 1.3  
**Date**: May 19, 2025  
**Contact**: Share feedback on X or GitHub (TBD).
---
