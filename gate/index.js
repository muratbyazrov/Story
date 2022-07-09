const {utils} = require('../utils');
const {validator} = require('../validator');
const {logger} = require('../logger');
const {systemResponse} = require('../system-response');
const {gateSchema} = require('./gate-schema.js');
const {ValidationError} = require('../system-errors/validation-error');

class Gate {
    constructor(controllers) {
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

            console.info(`SYSTEM [INFO]: Got request:`, data);
            if (!this.controllers[data.domain]) {
                throw new ValidationError('Incorrect domain')
            }
            if (!this.controllers[data.domain][data.event]) {
                throw new ValidationError('Method not found');
            }
            validator.validate(data, gateSchema);
            const result = systemResponse.form(request, await this.controllers[data.domain][data.event](data));
            console.info(`SYSTEM [INFO]: Send result:`, result);
            return result;
        } catch (err) {
            const error = systemResponse.form(request, err);
            logger.log(error);
            return error;
        }
    }
}

module.exports = {Gate};
