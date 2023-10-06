const {ValidationError} = require('./validation-error.js');
const {DbError} = require('./db-error.js');
const {NotFoundError} = require('./not-found-error.js');
const {Forbidden} = require('./forbidden.js');
const {RmqError} = require('./rmq-error.js');
const {TokenError} = require('./token-error.js');
const {InternalError} = require('./internal-error.js');
const {FilesAdapterError} = require('./files-adapter-error.js');
const {BadRequestError} = require('./bad-request-error.js');

module.exports = {
    ValidationError,
    DbError,
    NotFoundError,
    Forbidden,
    TokenError,
    RmqError,
    InternalError,
    FilesAdapterError,
    BadRequestError,
    errors: {
        NotFoundError,
        Forbidden,
        ValidationError,
        BadRequestError,
    }
};
