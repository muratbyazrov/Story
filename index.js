const {validator} = require('./validator');
const {logger} = require('./logger');
const {utils} = require('./utils');
const {systemResponse} = require('./system-response');
const {DbAdapter} = require('./db-adapter');
const {HttpAdapter} = require('./http-adapter');
const {WsAdapter} = require('./ws-adapter');
const {Gate} = require('./gate');

class Story {
    constructor() {
        this.logger = logger;
        this.utils = utils;
        this.validator = validator;
        this.systemResponse = systemResponse;
    }

    gateInit(config, controllers) {
        this.gate = new Gate(config, controllers);
    }

    adaptersInit({db, http, ws, rmq}) {
        db &&
        (this.dbAdapter = new DbAdapter(config)) &&
        this.httpAdapter.run(request => this.gate.run(request));

        http &&
        (this.httpAdapter = new HttpAdapter(config)) &&
        this.wsAdapter.run(request => this.gate.run(request));

        ws &&
        (this.wsAdapter = new WsAdapter(config)) &&
        this.wsAdapter.run(request => this.gate.run(request));

        rmq &&
        (this.rmqAdapter = new rmqAdapter(config)) &&
        this.rmqAdapter.run(request => this.gate.run(request));
    }
}

module.exports = {
    Story: new Story(),
};
