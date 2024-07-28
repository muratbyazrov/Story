const {utils} = require('../utils');
const {validator} = require('../validator');
const {logger} = require('../logger');
const {responseFabric} = require('../response-fabric');
const {gateSchema} = require('./gate-schema.js');
const {ValidationError, NotFoundError, InternalError} = require('../errors');
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
    init(config, entities) {
        this.controllers = {};
        for (const {domain, Controller, Service} of entities) {
            this._checkDomainParams(domain, Controller, Service);
            const service = new Service(config);
            this.controllers[domain] = new Controller(config, service);
        }
        return this;
    }

    async run(request, protocol) {
        try {
            const {data, tokenData} = await this.validate(request, protocol);
            const result = responseFabric.build(
                request,
                await this.controllers[data.domain][data.event](data, tokenData),
            );
            logger.info({[`Send ${protocol} response`]: result});

            return result;
        } catch (err) {
            const error = responseFabric.build(request, err);
            logger.error({[`Send ${protocol} error`]: error});
            return error;
        }
    }

    async validate(request, protocol) {
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

        return {data, tokenData};
    }

    _checkDomainParams(domain, Controller, Service) {
        if (!domain) {
            const errorText = 'domain not specified in App.js';
            logger.error(errorText);
            throw new InternalError(errorText);
        }
        if (!Controller) {
            const errorText = `Controller for domain "${domain}" not specified in App.js`;
            logger.error(errorText);
            throw new InternalError(errorText);
        }
        if (!Service) {
            const errorText = `Service for domain "${domain}" not specified in App.js`;
            logger.error(errorText);
            throw new InternalError(errorText);
        }
    }
}

module.exports = {gate: new Gate()};
