class Timeout {
    constructor(message) {
        this.isError = true;
        this.code = 408;
        this.name = 'Timeout';
        this.message = message;
    }
}

module.exports = {Timeout};
