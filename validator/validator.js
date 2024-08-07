const {validate} = require('jsonschema');
const {ValidationError} = require('../errors');

class Validator {
    constructor() {
        this.schemaItems = {
            object: {type: 'object'},
            params: {type: 'object'},
            string: {type: 'string'},
            string1: {type: 'string', minLength: 1},
            number: {type: 'number'},
            number1: {type: 'number', minValue: 1},
            limit: {type: 'number', minValue: 1},
            array: {type: 'array'},
            array1: {type: 'array', minItems: 1},
            boolean: {type: 'boolean'},
            nullify: {type: 'null'},
            nullOrString: ['null', 'string'],
            nullOrNumber: ['null', 'number'],
            nullOrArray: ['null', 'array'],
            nullOrObject: ['null', 'object'],
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
