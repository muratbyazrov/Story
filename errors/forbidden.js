class Forbidden {
    constructor(message) {
        this.isError = true;
        this.code = 403;
        this.name = 'Forbidden';
        this.message = message;
    }
}

module.exports = {Forbidden};
