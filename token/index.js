const jwt = require('jsonwebtoken');
const {TokenError} = require("../errors");

class Token {
    async generateToken(data, config) {
        if (!config || !config.key) throw new TokenError('Token config not specified');
        const {key, expiresIn, algorithm} = config;
        return new Promise((resolve, reject) => {
            jwt.sign({...data}, key, {algorithm, expiresIn}, (error, token) => {
                if (error) {
                    reject(new TokenError(error.message));
                }
                resolve(token);
            });
        });
    }

    decodeToken(config, token) {
        const {key, algorithm} = config.token;
        return new Promise((resolve, reject) => {
            jwt.verify(token, key, {algorithm}, (error, decoded) => {
                if (error) {
                    reject(new TokenError(error.message));
                }
                resolve(decoded);
            });
        });
    }

    async checkToken(config, {token, domain, event}) {
        if (config.token.enabled && !token) {
            throw new TokenError('Token must be specified');
        }
        if (!config.token.enabled) {
            return true
        }
        if (config.token.uncheckMethods && config.token.uncheckMethods[domain]?.includes(event)) {
            return true
        }

        return this.decodeToken(config, token);
    }
}

module.exports = {token: new Token()};
