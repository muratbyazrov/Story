const {validator} = require('./validator');
const {logger} = require('./logger');
const {utils} = require('./utils');
const {response} = require('./response');
const {token} = require("./token");
const {DbAdapter} = require('./db-adapter');
const {filesAdapter} = require('./files-adapter');
const {HttpAdapter} = require('./http-adapter');
const {WsAdapter} = require('./ws-adapter');
const {RmqAdapter} = require('./rmq-adapter');
const {Gate} = require('./gate');
const {errors} = require('./errors');
const defaultConfig = require('./default-config');

/** class */
class Story {
    constructor() {
        this.logger = logger;
        this.utils = utils;
        this.validator = validator;
        this.response = response;
        this.token = token;
        this.errors = errors;
        this.filesAdapter = filesAdapter;
    }

    /**
     * @param {object} config - Options for initializing protocols
     */
    configInit(config) {
        if (!process.env.NODE_ENV) {
            throw new this.errors.NotFoundError(`It is necessary to set the environment variable NODE_ENV`);
        }
        const _config = config[process.env.NODE_ENV];
        if (!_config) {
            throw new this.errors.NotFoundError(`Config: "${process.env.NODE_ENV}" is not found`);
        }
        this.config = utils.mergeConfig(_config, defaultConfig);
    }

    /**
     * Initialize the gate with configuration and controllers.
     * @param {Array<Object>} controllers - An array of controller objects.
     */
    gateInit(controllers) {
        this.gate = new Gate(this.config, controllers);
    }

    /** Initialize adapters */
    adaptersInit() {
        const {db, filesAdapter: filesAdapterCfg} = this.config;

        db &&
        (this.dbAdapter = new DbAdapter(db));

        if (filesAdapterCfg) {
            const {http, ws, rmq} = filesAdapterCfg.protocols;
            if (http || ws || rmq) {
                filesAdapter.init(filesAdapterCfg);
            }
        }

        token.init(this.config);
    }

    /** Initialize communication protocols */
    protocolsInit() {
        const {http, ws, rmq, filesAdapter} = this.config;

        http &&
        (this.httpAdapter = new HttpAdapter(http, filesAdapter)) &&
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
