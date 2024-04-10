const {utils} = require('../utils');
const {validator} = require('../validator');
const {logger} = require('../logger');
const {response} = require('../response');
const {gateSchema} = require('./gate-schema.js');
const {ValidationError, NotFoundError} = require('../errors');
const {token} = require('../token');

/**
 * Constructs an instance of GateManager.
 * @constructor
 * @param {Object} config - Configuration object.
 * @param {Array<Object>} entities - An array of controller objects.
 * Each object in the array must have the following structure:
 * @param {string} entities.domain - The domain of the controller.
 * @param {Controller} entities.Controller - The controller class.
 * @param {Service} entities.Controller.service - The service instance associated with the controller.
 * @param {Service} entities.Service - The service class.
 */
class Gate {
    constructor(config, entities) {
        this.controllers = {};
        for (const {domain, Controller, Service} of entities) {
            const service = new Service(config);
            this.controllers[domain] = new Controller(config, service);
        }
    }

    async run(request, protocol) {
        try {
            let data;
            if (utils.isObject(request)) {
                data = request;
            } else if (utils.isJson(request)) {
                data = JSON.parse(request);
            } else {
                throw new ValidationError('Request error. Maybe request is not JSON');
            }

            logger.info({[`Got ${protocol} request`]: data});
            validator.validate(data, gateSchema);
            const tokenData = await token.checkToken(data);

            if (!this.controllers[data.domain]) {
                throw new NotFoundError('Incorrect domain');
            }
            if (!this.controllers[data.domain][data.event]) {
                throw new NotFoundError('Method (event) not found');
            }
            if (request.error) {
                throw request.error;
            }
            const result = response.format(request, await this.controllers[data.domain][data.event](data, tokenData));
            logger.info({[`Send ${protocol} response`]: result});
            return result;
        } catch (err) {
            const error = response.format(request, err);
            logger.error({[`Send ${protocol} error`]: error});
            return error;
        }
    }
}

module.exports = {Gate};
