class DbError {
    constructor(message) {
        this.isError = true;
        this.code = 900;
        this.name = 'Data Base error';
        this.message = message;
    }
}

module.exports = {DbError};
