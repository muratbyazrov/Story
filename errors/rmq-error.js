class RmqError {
    constructor(message) {
        this.code = 1600;
        this.name = 'RMQ error';
        this.message = message;
    }
}

module.exports = {RmqError};
