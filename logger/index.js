const winston = require('winston');

class Logger {
    constructor() {
        this.logger = winston.createLogger({
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    )
                })
            ]
        });
    }

    info(message, data) {
        this.logger.info({
            message,
            data
        });
    }

    error(message, error) {
        this.logger.error({
            message,
            error: error.stack
        });
    }
}

module.exports = {logger: new Logger()};
