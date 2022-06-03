class ValidationError {
    constructor(message) {
        this.isError = true;
        this.code = 404;
        this.name = 'Validation Error';
        this.message = message;
    }
}

module.exports = {ValidationError};
