const chalk = require('chalk');
const {utils} = require('../utils');
const defaultConfig = require('../default-config');

class Logger {
    constructor() {
        this.config = {...defaultConfig.logger};
        this.levels = {
            debug: 10,
            info: 20,
            warn: 30,
            error: 40,
        };
    }

    configure(mergedConfig) {
        this.config = {
            ...defaultConfig.logger,
            ...(mergedConfig.logger || {}),
        };
    }

    shouldLog(level) {
        const configuredLevel = this.config.level || defaultConfig.logger.level;
        const currentLevel = this.levels[configuredLevel] || this.levels.info;
        const targetLevel = this.levels[level] || this.levels.info;
        return targetLevel >= currentLevel;
    }

    formatMessage(data) {
        if (data instanceof Error) {
            return data.stack || data.message;
        }

        const overrideData = utils.overrideObjectField(data, this.config.replacerList);
        if (typeof overrideData === 'string') {
            return overrideData;
        }
        return JSON.stringify(overrideData, null, 2);
    }

    write(level, color, method, data) {
        if (!this.shouldLog(level)) {
            return;
        }
        const timestamp = chalk.gray(`(${new Date().toLocaleString()})`);
        const levelLabel = color.bold(`[${level.toUpperCase()}]`);
        const message = this.formatMessage(data);
        console[method](`${timestamp} ${levelLabel}:`, message);
    }

    debug(data) {
        this.write('debug', chalk.magenta, 'debug', data);
    }

    info(data) {
        this.write('info', chalk.blue, 'info', data);
    }

    warn(data) {
        this.write('warn', chalk.yellow, 'warn', data);
    }

    error(error) {
        this.write('error', chalk.red, 'error', error);
    }
}

module.exports = {logger: new Logger()};
