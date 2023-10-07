class Utils {
    isJson(data) {
        let result = true;
        try {
            JSON.parse(data);
        } catch (err) {
            result = false;
        }
        return result;
    };

    isObject(data) {
        return typeof data === 'object' && !Array.isArray(data) && data !== null;
    };

    has(obj, keyName) {
        if (!obj) {
            return false;
        }
        return Object.prototype.hasOwnProperty.call(obj, keyName);
    };

    objectDeepCopy = (obj) => JSON.parse(JSON.stringify(obj));

    overrideObjectField = (obj, fieldName, newValue) => {
        if (!this.isObject(obj)) {
            return obj;
        }

        const objectCopy = this.objectDeepCopy(obj);
        this._overrideObjectField(objectCopy, fieldName, newValue);
        return objectCopy;
    };

    _overrideObjectField = (obj, fieldName, newValue) => {
        if (!this.isObject(obj)) {
            return;
        }

        for (const objKey in obj) {
            if (this.isObject(obj[objKey])) {
                this._overrideObjectField(obj[objKey], fieldName, newValue);
            }

            if (objKey === fieldName) {
                obj[objKey] = newValue;
            }
        }
    };

    mergeObjects(obj1, obj2) {
        const obj3 = {...obj1};

        for (const key in obj2) {
            if (typeof obj2[key] === 'object' && typeof obj1[key] === 'object') {
                obj3[key] = this.mergeObjects(obj1[key], obj2[key]);
            } else if (!obj1.hasOwnProperty(key)) {
                obj3[key] = obj2[key];
            }
        }

        return obj3;
    }
}

module.exports = {utils: new Utils()};
