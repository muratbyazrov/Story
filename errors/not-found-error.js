class NotFoundError {
    constructor(message) {
        this.code = 404;
        this.name = 'Not found';
        this.message = message;
    }
}

module.exports = {NotFoundError};
