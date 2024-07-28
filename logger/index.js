const {utils} = require('../utils');

class Logger {
    configure({logger}) {
        this.config = logger;
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
