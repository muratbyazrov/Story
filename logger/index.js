const {utils} = require('../utils');
const defaultConfig = require('../default-config');

class Logger {
    configure(mergedConfig) {
        this.config = mergedConfig.logger || defaultConfig.logger;
    }

    info(data) {
        const overrideData = utils.overrideObjectField(data, this.config.replacerList);
        console.info(`(${new Date().toLocaleString()}) [INFO]: `, overrideData);
    }

    error(error) {
        console.error(`(${new Date().toLocaleString()}) [ERROR]: `, error);
    }
}

module.exports = {logger: new Logger()};
