class RmqError {
    constructor(message) {
        this.isError = true;
        this.code = 600;
        this.name = 'RMQ error';
        this.message = message;
    }
}

module.exports = {RmqError};
