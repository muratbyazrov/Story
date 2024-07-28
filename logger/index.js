const {utils} = require('../utils');

class Logger {
    info(data) {
        const overrideData = utils.overrideObjectField(data, 'token', '***');
        console.info(`(${new Date().toLocaleString()}) [INFO]: `, overrideData);
    }

    error(error) {
        console.error(`(${new Date().toLocaleString()}) [ERROR]: `, error);
    }
}

module.exports = {logger: new Logger()};
