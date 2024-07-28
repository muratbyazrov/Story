class Forbidden {
    constructor(message) {
        this.code = 403;
        this.name = 'Forbidden';
        this.message = message;
    }
}

module.exports = {Forbidden};
