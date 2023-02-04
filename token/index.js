const jwt = require('jsonwebtoken');
const {logger} = require("../logger");
const {Forbidden} = require("../errors");

class Token {
    async generateToken(data, config) {
        const {key, expiresIn = 24 * 60 * 60 * 1000} = config.token;
        return new Promise((resolve, reject) => {
            jwt.sign({...data}, key, {algorithm: 'HS256', expiresIn}, (error, token) => {
                if (error) {
                    logger.error(error);
                    reject(new Forbidden(error.message));
                }
                resolve(token);
            });
        });
    }

    decodeToken(config, token) {
        const {key} = config.token;
        return jwt.verify(token, key, {algorithm: 'RS256'}, (error) => {
            logger.error(error);
            throw new Forbidden(error.message);
        })
    }

    checkToken(config, {token, domain, event}) {
        if (!config.token.enabled) {
            return true;
        }
        if (config.token.uncheckMethods[domain] === event) {
            return true;
        }
        if (!token) {
            throw new Forbidden('Token must be specified');
        }
        return this.decodeToken(config, token);
    }
}

module.exports = {token: new Token()};
