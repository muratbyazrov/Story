const {validator: {schemaItems: {string1, object}}} = require('../validator');

const gateSchema = {
    id: '/Gate',
    type: 'object',
    required: ['event', 'domain', 'params'],
    properties: {
        event: string1,
        domain: string1,
        params: object,
        token: string1,
    },
};

module.exports = {
    gateSchema,
};
