class InternalError {
    constructor(message) {
        this.isError = true;
        this.code = 500;
        this.name = 'Internal error';
        this.message = message;
    }
}

module.exports = {InternalError};
