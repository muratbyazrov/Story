const {utils} = require('../utils');
const {validator} = require('../validator');
const {logger} = require('../logger');
const {response} = require('../response');
const {gateSchema} = require('./gate-schema.js');
const {ValidationError, NotFoundError} = require('../errors');

class Gate {
    constructor(config, controllers) {
        this.controllers = {};
        for (const {EntityController, domain} of controllers) {
            this.controllers[domain] = new EntityController();
        }
    }

    async run(request) {
        try {
            let data;
            if (utils.isObject(request)) {
                data = request;
            } else if (utils.isJson(request)) {
                data = JSON.parse(request);
            } else {
                throw new ValidationError('Request error. Maybe request is not JSON');
            }

            logger.info({"Got request": data});
            if (!this.controllers[data.domain]) {
                throw new NotFoundError('Incorrect domain');
            }
            if (!this.controllers[data.domain][data.event]) {
                throw new NotFoundError('Method (event) not found');
            }
            validator.validate(data, gateSchema);
            const result = response.format(request, await this.controllers[data.domain][data.event](data));
            logger.info({"Send result": result});
            return result;
        } catch (err) {
            const error = response.format(request, err);
            logger.error(error);
            return error;
        }
    }
}

module.exports = {Gate};
