const { CDLSerializer } = require('./cdl_serializer');
const { CDLDeserializer } = require('./cdl_deserializer');

/**
 * Recursively find all values for a given key in a nested object or array.
 * @param {object|array} obj - The object or array to search.
 * @param {string} key - The key to search for.
 * @returns {array} - Array of all values found for the key.
 */
function findAllValuesByKey(obj, key) {
    let results = [];
    if (Array.isArray(obj)) {
        for (const item of obj) {
            results = results.concat(findAllValuesByKey(item, key));
        }
    } else if (obj && typeof obj === 'object') {
        for (const k in obj) {
            if (k === key) {
                results.push(obj[k]);
            }
            results = results.concat(findAllValuesByKey(obj[k], key));
        }
    }
    return results;
}

module.exports = {
    CDLSerializer,
    CDLDeserializer,
    findAllValuesByKey,
}; 