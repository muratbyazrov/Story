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

    objectDeepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    overrideObjectField(obj, fields) {
        if (!this.isObject(obj)) {
            return obj;
        }

        const objectCopy = this.objectDeepCopy(obj);

        for (const {name, newValue} of fields) {
            this._overrideObjectField(objectCopy, name, newValue);
        }

        return objectCopy;
    }

    _overrideObjectField(obj, fieldName, newValue) {
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
    }

    mergeConfig(cfg1, cfg2) {
        const cfg3 = {};
        for (const el in cfg1) {
            cfg3[el] = this.mergeObjects(cfg1[el], cfg2[el]);
        }

        return cfg3;
    }

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
