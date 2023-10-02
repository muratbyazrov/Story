class FilesAdapterError {
    constructor(message) {
        this.isError = true;
        this.code = 500;
        this.name = 'Files adapter error';
        this.message = message;
    }
}

module.exports = {FilesAdapterError};
