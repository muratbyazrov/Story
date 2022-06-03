const {Validator} = require('./validator.js');
const schemaItems = {
    params: {
        'type': 'object',
    },
    string: {'type': 'string'},
    number: {'type': 'number'},
    limit: {'type': 'number', 'minValue': 1},
};

module.exports = {
    validator: new Validator(),
    schemaItems,
};
