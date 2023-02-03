const {ValidationError} = require('./validation-error.js');
const {DbError} = require('./db-error.js');
const {NotFoundError} = require('./not-found-error.js');
const {Forbidden} = require('./forbidden.js');

module.exports = {
    ValidationError,
    DbError,
    NotFoundError,
    Forbidden,
    errors: {
        NotFoundError,
        Forbidden,
        ValidationError,
    }
};
