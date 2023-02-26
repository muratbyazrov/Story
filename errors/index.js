const {ValidationError} = require('./validation-error.js');
const {DbError} = require('./db-error.js');
const {NotFoundError} = require('./not-found-error.js');
const {Forbidden} = require('./forbidden.js');
const {RmqError} = require('./rmq-error.js');
const {TokenError} = require('./token-error.js');

module.exports = {
    ValidationError,
    DbError,
    NotFoundError,
    Forbidden,
    TokenError,
    errors: {
        NotFoundError,
        Forbidden,
        ValidationError,
        RmqError,
    }
};
