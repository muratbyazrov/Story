const path = require('path');
const {validator} = require('./validator');
const {logger} = require('./logger');
const {utils} = require('./utils');
const {response} = require('./response-fabric');
const {token} = require('./token');
const {DbAdapter} = require('./db-adapter');
const {filesAdapter} = require('./files-adapter');
const {HttpAdapter} = require('./http-adapter');
const {WsAdapter} = require('./ws-adapter');
const {RmqAdapter} = require('./rmq-adapter');
const {gate} = require('./gate');
const {errors, NotFoundError} = require('./errors');
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

    configInit() {
        if (!process.env.NODE_ENV) {
            throw new NotFoundError(`It is necessary to set the environment variable NODE_ENV`);
        }
        const configPath = path.join(`${path.dirname(require.main.filename)}`, `config.${process.env.NODE_ENV}.js`);
        // eslint-disable-next-line global-require
        const config = require(configPath);
        const mergedConfig = utils.mergeConfig(config, defaultConfig);
        this.config = mergedConfig;
        // logger configure
        logger.configure({mergedConfig});
    }

    /**
     * Initialize the gate with configuration and controllers.
     * @param {Array<Object>} entities - An array of controller objects.
     */
    gateInit(entities) {
        this.gate = gate.init(this.config, entities);
    }

    /** Initialize adapters */
    adaptersInit() {
        const {db: dbConfig, filesAdapter: filesAdapterCfg, token: tokenCfg} = this.config;

        dbConfig &&
        (this.dbAdapter = new DbAdapter(dbConfig));

        filesAdapterCfg &&
        filesAdapter.init(filesAdapterCfg);

        tokenCfg &&
        token.init(tokenCfg);
    }

    /** Initialize communication protocols */
    protocolsInit() {
        const {http: httpCfg, ws: wsCfg, rmq: rmqCfg, filesAdapter: filesAdapterCfg} = this.config;

        httpCfg &&
        (this.httpAdapter = new HttpAdapter(httpCfg, filesAdapterCfg)) &&
        this.httpAdapter.run(request => this.gate.run(request, 'http'));

        wsCfg &&
        (this.wsAdapter = new WsAdapter(wsCfg)) &&
        this.wsAdapter.run(request => this.gate.run(request, 'ws'));

        rmqCfg &&
        (this.rmqAdapter = new RmqAdapter(rmqCfg)) &&
        this.rmqAdapter.run(request => this.gate.run(request, 'rmq'));
    }
}

module.exports = {Story: new Story()};
