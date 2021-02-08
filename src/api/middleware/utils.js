const HTTPStatus = require("http-status-codes");
const { APIError, ErrorTypes, hideInsecureError } = require("./errorHandler");
const ValidationReasons = require("./validators/validationReasons");
const lodash = require("lodash");

const DEFAULT_ERROR_CODE = ErrorTypes.VALIDATION_ERROR;
const DEFAULT_ERROR_MSG = ValidationReasons.UNKNOWN;
const DEFAULT_STATUS_CODE = HTTPStatus.BAD_REQUEST;

/**
 * Combines array of middleware using OR logic. Only fails if ALL functions fail (either by throwing or calling next(error))
 *
 * Each middleware will receive a different req object, no not rely on it to be shared among them
 *
 * The failed middleware errors will be available in the `or` field of the response.
 * However, only APIErrors will show the actual error message, in order to prevent unwanted errors (such as DB's) to leak here
 *
 * @param {Function[]} middleware: Array of express middleware to be run
 * @param {object} Options:
 *  - error_code: error code in case of error (default: ErrorTypes.VALIDATION_ERROR)
 *  - msg: the message in case of error (default: ValidationReasons.UNKNOWN)
 *  - status_code: The status used in the HTTP Response in case of error (default: BAD_REQUEST (400))
 */
const or = (
    [...middlewares],
    {
        error_code = DEFAULT_ERROR_CODE,
        msg = DEFAULT_ERROR_MSG,
        status_code = DEFAULT_STATUS_CODE
    } = {}
) => async (initialReq, res, next) => {
    let success = false;
    const errors = [];
    for (const middleware of middlewares) {
        const req = lodash.cloneDeep(initialReq);
        try {
            await middleware(req, res, (error) => {
                if (error) errors.push(hideInsecureError(error).toObject());
                else success = true;
            });
        } catch (error) {
            errors.push(hideInsecureError(error).toObject());
        }
        if (success) return next();
    }

    return next(new APIError(status_code, error_code, msg, { or: errors }));
};


module.exports = {
    or,
    DEFAULT_ERROR_CODE,
    DEFAULT_ERROR_MSG,
    DEFAULT_STATUS_CODE
};
