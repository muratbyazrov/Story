const {schemaItems: {string}} = require('../validator/index.js');

const gateSchema = {
    id: '/Gate',
    type: 'object',
    properties: {
        event: string,
        domain: string,
    },
    required: ['event', 'domain'],
};

module.exports = {
    gateSchema,
};
