class ValidationError {
    constructor(message) {
        this.isError = true;
        this.code = 422;
        this.name = 'Validation error';
        this.message = message;
    }
}

module.exports = {ValidationError};
