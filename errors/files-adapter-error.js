class FilesAdapterError {
    constructor(message) {
        this.code = 1800;
        this.name = 'Files adapter error';
        this.message = message;
    }
}

module.exports = {FilesAdapterError};
