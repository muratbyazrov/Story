class BadRequestError {
    constructor(message) {
        this.code = 400;
        this.name = 'Bad request';
        this.message = message;
    }
}

module.exports = {BadRequestError};
