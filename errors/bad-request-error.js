class BadRequestError {
    constructor(message) {
        this.isError = true;
        this.code = 400;
        this.name = 'Bad request';
        this.message = message;
    }
}

module.exports = {BadRequestError};
