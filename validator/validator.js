const {validate} = require('jsonschema');
const {ValidationError} = require('../system-errors');

class Validator {
    constructor() {
        this.schemaItems = {
            params: {
                'type': 'object',
            },
            string: {'type': 'string', minLength: 1},
            number: {'type': 'number'},
            limit: {'type': 'number', 'minValue': 1},
        };
    }

    validate(request, schema) {
        const validateResult = validate(request, schema);

        if (validateResult.errors.length) {
            throw new ValidationError(validateResult.errors[0].stack);
        }
    }
}

module.exports = {Validator};
