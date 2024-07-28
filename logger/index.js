const {utils} = require('../utils');

class Logger {
    info(data) {
        const overrideData = utils.overrideObjectField(data, [
            {name: 'token', newValue: '***'},
            {name: 'base64File', newValue: 'base64String...'},
        ]);
        console.info(`(${new Date().toLocaleString()}) [INFO]: `, overrideData);
    }

    error(error) {
        console.error(`(${new Date().toLocaleString()}) [ERROR]: `, error);
    }
}

module.exports = {logger: new Logger()};
