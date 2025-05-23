class CDLSerializer {
    serialize(data) {
        if (typeof data !== 'object' || data === null) {
            throw new Error('Root must be an object');
        }
        const content = this.serializeObject(data);
        return `---${content}---`;
    }

    serializeObject(obj) {
        const keys = [];
        const values = [];
        for (const [key, value] of Object.entries(obj)) {
            keys.push(this.escapeKey(key));
            values.push(this.serializeValue(value));
        }
        return `${keys.join('|')}:${values.join(',')}`;
    }

    serializeValue(value) {
        if (value === null) return 'null';
        if (typeof value === 'number') {
            return Number.isInteger(value) ? value.toString() : value.toString();
        }
        if (typeof value === 'boolean') return value.toString();
        if (Array.isArray(value)) {
            return this.serializeArray(value);
        }
        if (typeof value === 'object') {
            return `(${this.serializeObject(value)})`;
        }
        return this.escapeString(value);
    }

    serializeArray(arr) {
        if (arr.length === 0) return '[]';
        const isObjectArray = arr.every(item => typeof item === 'object' && item !== null && !Array.isArray(item));
        if (isObjectArray) {
            const firstObj = arr[0];
            const keys = Object.keys(firstObj).map(k => this.escapeKey(k));
            const values = arr.flatMap(obj => keys.map(key => this.serializeValue(obj[key.replace(/^"|"$/g, '')])));
            return `[${keys.join('|')}:${values.join(',')}]`;
        }
        const values = arr.map(v => this.serializeValue(v));
        return `[${values.join(',')}]`;
    }

    escapeKey(key) {
        if (/^[a-zA-Z0-9_-]+$/.test(key) && !key.includes('|')) {
            return key;
        }
        return `"${String(key).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }

    escapeString(str) {
        const strVal = String(str);
        if (/^[a-zA-Z0-9_-]+$/.test(strVal)) {
            return strVal;
        }
        return `"${strVal.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
    }
}

module.exports = { CDLSerializer };

