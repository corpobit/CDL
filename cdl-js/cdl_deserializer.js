class CDLDeserializer {
    deserialize(input) {
        input = input.trim();
        console.log('CDL DEBUG deserialize input type:', typeof input);
        console.log('CDL DEBUG deserialize input value:', input);
        if (typeof input !== 'string') throw new Error('Invalid CDL format');

        if (input === '------') return {};
        
        if (!input.startsWith('---') || !input.endsWith('---')) {
            throw new Error('Invalid CDL format');
        }

        const content = input.slice(3, -3).trim();
        console.log('CDL DEBUG content:', content);

        let inQuotes = false, depth = 0, splitIndex = -1;
        for (let i = 0; i < content.length; i++) {
            const char = content[i];
            const prev = content[i - 1];
            if (char === '"' && prev !== '\\') inQuotes = !inQuotes;
            if (!inQuotes) {
                if (char === '(' || char === '[') depth++;
                if (char === ')' || char === ']') depth--;
                if (char === ':' && depth === 0) {
                    splitIndex = i;
                    break;
                }
            }
        }
        if (splitIndex !== -1) {
            const key = content.slice(0, splitIndex).trim();
            const value = content.slice(splitIndex + 1).trim();
            if (value.startsWith('(') || value.startsWith('[')) {
                return { [key]: this.parseValue(value) };
            }
        }
        let keysPart, valuesPart;
        try {
            [keysPart, valuesPart] = this.safeSplitLastColon(content);
        } catch (e) {
            throw new Error('Invalid CDL format');
        }
        console.log('CDL DEBUG keysPart:', keysPart);
        console.log('CDL DEBUG valuesPart:', valuesPart);
        if (!keysPart.trim() || !valuesPart.trim()) {
            throw new Error('Invalid CDL format');
        }

        if (keysPart.indexOf('|') !== -1 && valuesPart.indexOf(',') === -1 && valuesPart.indexOf('|') === -1 && /\w+:".*?"(\|\w+:".*?")*/.test(content)) {
            const pairs = content.split('|');
            const keys = [];
            const values = [];
            for (const pair of pairs) {
                const idx = pair.indexOf(':');
                if (idx === -1) throw new Error('Invalid CDL format');
                const key = pair.slice(0, idx).trim();
                const value = pair.slice(idx + 1).trim();
                keys.push(key);
                values.push(this.parseValue(value));
            }
            return this.buildObject(keys, values, true);
        }

        const keys = this.parseList(keysPart, '|');
        let values;
        if (valuesPart.indexOf(',') !== -1) {
            values = this.parseList(valuesPart, ',', true);
        } else if (keys.length > 1 && valuesPart.indexOf('|') !== -1) {
            values = this.parseList(valuesPart, '|', true);
        } else {
            values = [this.parseValue(valuesPart)];
        }

        if (keys.length === 1 && values.length === 1) {
            const v = values[0];
            const isPlain = v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean';
            if (isPlain && !(valuesPart.trim().startsWith('(') || valuesPart.trim().startsWith('['))) {
                throw new Error('Invalid CDL format');
            }
        }

        if (keys.length !== values.length && !(values.length === 1 && Array.isArray(values[0]))) {
            throw new Error('Mismatched keys and values');
        }

        return this.buildObject(keys, values, true);
    }

    safeSplitLastColon(input) {
        let inQuotes = false;
        let depth = 0;
        let splitIndex = -1;

        console.log('CDL DEBUG safeSplitLastColon input:', input);

        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            const prev = input[i - 1];

            if (char === '"' && prev !== '\\') {
                inQuotes = !inQuotes;
                continue;
            }

            if (inQuotes) continue;

            if (char === '(' || char === '[') {
                depth++;
            } else if (char === ')' || char === ']') {
                depth--;
            }

            if (char === ':' && depth === 0) {
                splitIndex = i;
            }
        }

        console.log('CDL DEBUG safeSplitLastColon splitIndex:', splitIndex);

        if (splitIndex === -1) {
            if (input.startsWith('(') && input.endsWith(')')) {
                return ['', input];
            }
            throw new Error('Invalid CDL format: unable to split');
        }

        return [input.slice(0, splitIndex), input.slice(splitIndex + 1)];
    }

    parseList(input, delimiter, parseNested = false) {
        const result = [];
        let token = '';
        let inQuotes = false;
        let depth = 0;

        for (let i = 0; i < input.length; i++) {
            const char = input[i];
            let backslashCount = 0;
            for (let j = i - 1; j >= 0 && input[j] === '\\'; j--) {
                backslashCount++;
            }
            if (char === '"' && backslashCount % 2 === 0) inQuotes = !inQuotes;
            if (!inQuotes) {
                if (char === '(' || char === '[') depth++;
                if (char === ')' || char === ']') depth--;
            }

            if (char === delimiter && !inQuotes && depth === 0) {
                result.push(token.trim());
                token = '';
            } else {
                token += char;
            }
        }

        if (token) result.push(token.trim());

        if (parseNested) {
            return result.map(v => this.parseValue(v));
        }

        return result.map(k => {
            const key = k.split(':')[0].trim();
            if (key.startsWith('"') && key.endsWith('"')) {
                return key.slice(1, -1).replace(/\\"/g, '"');
            }
            return key.replace(/\\"/g, '"');
        });
    }

    parseValue(value) {
        value = value.trim();

        if (value === 'null') return null;
        if (value === 'true') return true;
        if (value === 'false') return false;

        if (value.startsWith('"') && value.endsWith('"')) {
            return value.slice(1, -1)
                .replace(/\\"/g, '"')
                .replace(/\\:/g, ':')
                .replace(/\\,/g, ',')
                .replace(/\\\\/g, '\\');
        }

        if (!isNaN(value) && value !== '') return Number(value);

        if (value.startsWith('[') && value.endsWith(']')) {
            const inner = value.slice(1, -1);
            if (inner.includes('|') && inner.includes(':')) {
                const [keysPart, valuesPart] = this.safeSplitLastColon(inner);
                const keys = this.parseList(keysPart, '|');
                const values = this.parseList(valuesPart, ',', true);
                return this.buildArrayOfObjects(keys, values);
            } else {
                return this.parseList(inner, ',', true);
            }
        }

        if (value.startsWith('(') && value.endsWith(')')) {
            const inner = value.slice(1, -1);
            const [k, v] = this.safeSplitLastColon(inner);
            const keys = this.parseList(k, '|');
            const values = this.parseList(v, ',', true);
            return this.buildObject(keys, values);
        }

        return value;
    }

    buildArrayOfObjects(keys, values) {
        const result = [];
        const chunkSize = keys.length;
        
        for (let i = 0; i < values.length; i += chunkSize) {
            const chunk = values.slice(i, i + chunkSize);
            const obj = {};
            for (let j = 0; j < keys.length; j++) {
                obj[keys[j]] = chunk[j];
            }
            result.push(obj);
        }
        
        return result;
    }

    buildObject(keys, values, isTopLevel = false) {
        if (values.length === 1 && Array.isArray(values[0]) && keys.length > 1) {
            const flatValues = values[0];
            const chunkSize = keys.length;
            const result = [];
            for (let i = 0; i < flatValues.length; i += chunkSize) {
                const chunk = flatValues.slice(i, i + chunkSize);
                const obj = {};
                for (let j = 0; j < keys.length; j++) {
                    obj[keys[j]] = chunk[j];
                }
                result.push(obj);
            }
            return { [keys[0]]: result };
        }

        const obj = {};
        for (let i = 0; i < keys.length; i++) {
            obj[keys[i]] = values[i];
        }
        return obj;
    }
}

module.exports = { CDLDeserializer };
