const {validate} = require('jsonschema');
const {ValidationError} = require('../system-errors');

class Validator {
    validate(request, schema) {
        const validateResult = validate(request, schema);

        if (validateResult.errors.length) {
            throw new ValidationError(validateResult.errors[0].stack);
        }
    }
}

module.exports = {Validator};
