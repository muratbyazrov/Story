class DbError {
    constructor(message) {
        this.code = 1900;
        this.name = 'Database error';
        this.message = message;
    }
}

module.exports = {DbError};
