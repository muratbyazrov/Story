const {validator} = require('./validator');
const {logger} = require('./logger');
const {utils} = require('./utils');
const {response} = require('./response');
const {token} = require("./token");
const {DbAdapter} = require('./db-adapter');
const {HttpAdapter} = require('./http-adapter');
const {WsAdapter} = require('./ws-adapter');
const {RmqAdapter} = require('./rmq-adapter');
const {Gate} = require('./gate');
const {errors} = require('./errors');
const {request} = require("express");

class Story {
    constructor() {
        this.logger = logger;
        this.utils = utils;
        this.validator = validator;
        this.response = response;
        this.token = token;
        this.errors = errors;
    }

    gateInit(config, controllers) {
        this.gate = new Gate(config, controllers);
    }

    adaptersInit({db, http, ws, rmq}) {
        db && (this.dbAdapter = new DbAdapter(db))

        http &&
        (this.httpAdapter = new HttpAdapter(http)) &&
        this.httpAdapter.run(request => this.gate.run(request));

        ws &&
        (this.wsAdapter = new WsAdapter(ws)) &&
        this.wsAdapter.run(request => this.gate.run(request));

        rmq &&
        (this.rmqAdapter = new RmqAdapter(rmq)) &&
        this.rmqAdapter.run(request => this.gate.run(request));
    }
}

module.exports = {
    Story: new Story(),
};
