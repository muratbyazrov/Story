class TokenError {
    constructor(message) {
        this.code = 401;
        this.name = 'Token error';
        this.message = message;
    }
}

module.exports = {TokenError};
