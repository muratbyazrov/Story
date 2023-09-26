const {validator} = require('./validator');
const {logger} = require('./logger');
const {utils} = require('./utils');
const {response} = require('./response');
const {token} = require("./token");
const {DbAdapter} = require('./db-adapter');
const {FileProcessor} = require('./file-processor');
const {HttpAdapter} = require('./http-adapter');
const {WsAdapter} = require('./ws-adapter');
const {RmqAdapter} = require('./rmq-adapter');
const {Gate} = require('./gate');
const {errors} = require('./errors');

/** class */
class Story {
    constructor() {
        this.logger = logger;
        this.utils = utils;
        this.validator = validator;
        this.response = response;
        this.token = token;
        this.errors = errors;
    }

    /**
     * Initialize the gate with configuration and controllers.
     * @param {object} config - The gate configuration.
     * @param {Array<Object>} controllers - An array of controller objects.
     */
    gateInit(config, controllers) {
        this.gate = new Gate(config, controllers);
    }

    /**
     * Initialize processors if provided.
     * @param {object} options - Options for initializing processors.
     * @param {object} options.db - Database configuration.
     * @param {object} options.fileProcessor - File processor configuration.
     */
    processorsInit({db, fileProcessor}) {
        db &&
        (this.dbAdapter = new DbAdapter(db));

        fileProcessor &&
        (this.fileProcessor = new FileProcessor(fileProcessor));
    }

    /**
     * Initialize communication protocols if provided.
     * @param {object} options - Options for initializing adapters.
     * @param {object} options.http - HTTP adapter configuration.
     * @param {object} options.ws - WebSocket adapter configuration.
     * @param {object} options.rmq - RabbitMQ adapter configuration.
     * @param {object} options.fileProcessor - File processor configuration.
     */
    protocolsInit({http, ws, rmq, fileProcessor}) {
        http &&
        (this.httpAdapter = new HttpAdapter(http, fileProcessor)) &&
        this.httpAdapter.run(request => this.gate.run(request, 'http'));

        ws &&
        (this.wsAdapter = new WsAdapter(ws)) &&
        this.wsAdapter.run(request => this.gate.run(request, 'ws'));

        rmq &&
        (this.rmqAdapter = new RmqAdapter(rmq)) &&
        this.rmqAdapter.run(request => this.gate.run(request, 'rmq'));
    }
}

module.exports = {Story: new Story()};
