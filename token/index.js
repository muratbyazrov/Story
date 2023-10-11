const jwt = require('jsonwebtoken');
const {TokenError} = require("../errors");

class Token {
    init({token}) {
        this.config = token;
    }

    async generateToken(data) {
        if (!this.config || !this.config.key) throw new TokenError('Token config not specified');
        const {key, expiresIn, algorithm} = this.config;
        return new Promise((resolve, reject) => {
            jwt.sign({...data}, key, {algorithm, expiresIn}, (error, token) => {
                if (error) {
                    reject(new TokenError(error.message));
                }
                resolve(token);
            });
        });
    }

    decodeToken(token) {
        const {key, algorithm} = this.config;
        return new Promise((resolve, reject) => {
            jwt.verify(token, key, {algorithm}, (error, decoded) => {
                if (error) {
                    reject(new TokenError(error.message));
                }
                resolve(decoded);
            });
        });
    }

    async checkToken({token, domain, event}) {
        const {enabled, uncheckMethods} = this.config;
        if (!enabled) return true
        if (uncheckMethods[domain]?.includes(event)) return true
        if (!token) throw new TokenError('Token must be specified');

        return this.decodeToken(token);
    }
}

module.exports = {token: new Token()};
