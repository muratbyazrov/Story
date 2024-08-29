const chalk = require('chalk');
const {utils} = require('../utils');
const defaultConfig = require('../default-config');

class Logger {
    configure(mergedConfig) {
        this.config = mergedConfig.logger || defaultConfig.logger;
    }

    info(data) {
        const overrideData = utils.overrideObjectField(data, this.config.replacerList);
        const timestamp = chalk.gray(`(${new Date().toLocaleString()})`);
        const level = chalk.blue.bold('[INFO]');
        const message = JSON.stringify(overrideData, null, 2);
        console.info(`${timestamp} ${level}:`, message);
    }

    error(error) {
        const timestamp = chalk.gray(`(${new Date().toLocaleString()})`);
        const level = chalk.red.bold('[ERROR]');
        const message = typeof error === 'object' ? JSON.stringify(error, null, 2) : error;
        console.error(`${timestamp} ${level}:`, message);
    }
}

module.exports = {logger: new Logger()};
