class ValidationError {
    constructor(message) {
        this.isError = true;
        this.code = 400;
        this.name = 'Validation error';
        this.message = message;
    }
}

module.exports = {ValidationError};
