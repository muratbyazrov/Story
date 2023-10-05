const {utils} = require('../utils');
const {validator} = require('../validator');
const {logger} = require('../logger');
const {response} = require('../response');
const {gateSchema} = require('./gate-schema.js');
const {ValidationError, NotFoundError, InternalError} = require('../errors');
const StoryErrors = require('../errors');
const {token} = require("../token");

class Gate {
    constructor(config, controllers) {
        this.config = config;
        this.controllers = {};
        for (const {EntityController, domain} of controllers) {
            this.controllers[domain] = new EntityController();
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
            const tokenData = await token.checkToken(this.config, data);

            if (!this.controllers[data.domain]) {
                throw new NotFoundError('Incorrect domain');
            }
            if (!this.controllers[data.domain][data.event]) {
                throw new NotFoundError('Method (event) not found');
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
