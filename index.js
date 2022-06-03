const {validator} = require('./validator');
const {logger} = require('./logger');
const {utils} = require('./utils');
const {systemResponse} = require('./system-response');
const {DbAdapter} = require('./db-adapter');
const {HttpAdapter} = require('./http-adapter');
const {WsAdapter} = require('./ws-adapter');
const {Gate} = require('./gate');

class System {
    init(config, gates) {
        this.logger = logger;
        this.utils = utils;
        this.validator = validator;
        this.systemResponse = systemResponse;
        this.dbAdapter = new DbAdapter(config);
        this.httpAdapter = new HttpAdapter(config);
        this.wsAdapter = new WsAdapter(config);
        this.gate = new Gate(gates);
    }
}

module.exports = {
    System: new System(),
};
