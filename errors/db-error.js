class DbError {
    constructor(message) {
        this.isError = true;
        this.code = 1800;
        this.name = 'Database error';
        this.message = message;
    }
}

module.exports = {DbError};
