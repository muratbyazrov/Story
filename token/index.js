const jwt = require('jsonwebtoken');
const {logger} = require("../logger");
const {Forbidden} = require("../errors");

class Token {
    generateToken(config, data) {
        const {key, expiresIn = 24 * 60 * 60 * 1000} = config.token;
        return jwt.sign({...data}, key, {algorithm: 'RS256', expiresIn}, (error) => {
            logger.error(error);
        });
    }

    decodeToken(config, token) {
        const {key} = config.token;
        return jwt.verify(token, key, {algorithm: 'RS256'}, (error) => {
            logger.error(error);
        })
    }

    checkToken(config, {checkToken = true, token}) {
        if (!checkToken) {
            return;
        }
        if (!token) {
            throw new Forbidden('Token must be specified');
        }
        return this.decodeToken(config, token);
    }
}

module.exports = {token: new Token()};
