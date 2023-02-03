const jwt = require('jsonwebtoken');
const {logger} = require("../logger");
const {Forbidden} = require("../errors");

class Token {
    async generateToken(config, data) {
        const {key, expiresIn = 24 * 60 * 60 * 1000} = config.token;
        let generatedToken = null;
        await jwt.sign({...data}, key, {algorithm: 'RS256', expiresIn}, (error, token) => {
            if (token) generatedToken = token;
            logger.error(error);
            throw new Forbidden(error.message);
        });
        return generatedToken;
    }

    decodeToken(config, token) {
        const {key} = config.token;
        return jwt.verify(token, key, {algorithm: 'RS256'}, (error) => {
            logger.error(error);
            throw new Forbidden(error.message);
        })
    }

    checkToken(config, {checkToken = true, token}) {
        if (!checkToken) {
            return true;
        }
        if (!token) {
            throw new Forbidden('Token must be specified');
        }
        return this.decodeToken(config, token);
    }
}

module.exports = {token: new Token()};
