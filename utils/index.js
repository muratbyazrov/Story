class Utils {
    isJson(data) {
        let result = true;
        try {
            JSON.parse(data);
        } catch (err) {
            result = false;
        }
        return result;
    }

    isObject(data) {
        return typeof data === 'object' && !Array.isArray(data) && data !== null;
    }

    has(obj, keyName) {
        if (!obj) {
            return false;
        }
        return Object.prototype.hasOwnProperty.call(obj, keyName);
    }
}

module.exports = {utils: new Utils()};
