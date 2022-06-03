class DbError {
    constructor(message) {
        this.isError = true;
        this.code = 300;
        this.name = 'Data Base Error';
        this.message = message;
    }
}

module.exports = {DbError};
