class TokenError {
    constructor(message) {
        this.isError = true;
        this.code = 800;
        this.name = 'Token error';
        this.message = message;
    }
}

module.exports = {TokenError};
