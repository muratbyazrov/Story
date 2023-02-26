const jwt = require('jsonwebtoken');
const {logger} = require("../logger");
const {TokenError} = require("../errors");

class Token {
    async generateToken(data, config) {
        if (!config || !config.key) throw new TokenError('Token config not specified');
        const {key, expiresIn = 24 * 60 * 60 * 1000} = config;
        return new Promise((resolve, reject) => {
            jwt.sign({...data}, key, {algorithm: 'HS256', expiresIn}, (error, token) => {
                if (error) {
                    logger.error(error);
                    reject(new TokenError(error.message));
                }
                resolve(token);
            });
        });
    }

    decodeToken(config, token) {
        const {key} = config.token;
        return new Promise((resolve, reject) => {
            jwt.verify(token, key, {algorithm: 'RS256'}, (error, decoded) => {
                if (error) {
                    logger.error(error);
                    reject(new TokenError(error.message));
                }
                resolve(decoded);
            });
        });
    }

    async checkToken(config, {token, domain, event}) {
        if (!config.token.enabled) {
            return true;
        }
        if (config.token.uncheckMethods && config.token.uncheckMethods[domain] === event) {
            return true;
        }
        if (!token) {
            throw new TokenError('Token must be specified');
        }
        return this.decodeToken(config, token);
    }
}

module.exports = {token: new Token()};
