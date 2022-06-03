const {validator: {string}} = require('../validator');

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
