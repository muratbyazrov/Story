const jwt = require('jsonwebtoken');
const {logger} = require("../logger");

class Token {
    generateToken(config, data) {
        const {key, expiresIn = 24 * 60 * 60 * 1000} = config;
        return jwt.sign({...data}, key, {algorithm: 'RS256', expiresIn}, (error) => {
            logger.error(error);
        });
    }

    decodeToken(config, token) {
        const {key} = config;
        return jwt.verify(token, key, {algorithm: 'RS256'}, (error) => {
            logger.error(error);
        })
    }

    checkToken({checkToken = true, token}) {
        if (!checkToken) {
            return;
        }
        return this.decodeToken(token);
    }
}

module.exports = {token: new Token()};
