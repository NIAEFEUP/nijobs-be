const HTTPStatus = require("http-status-codes");
const { APIError, ErrorTypes } = require("./errorHandler");
const ValidationReasons = require("./validators/validationReasons");
const lodash = require("lodash");

const DEFAULT_ERROR_CODE = ErrorTypes.VALIDATION_ERROR;
const DEFAULT_ERROR_MSG = ValidationReasons.UNKNOWN;
const DEFAULT_STATUS_CODE = HTTPStatus.BAD_REQUEST;

// TODO
// * ADD TESTS
// * REFACOTR EXISTING OR* MIDDLEWARE TO USE THIS
// * REFACTOR ALL MIDDLEWARE TO RETURN NEXT WITH ERROR (maybe not needed)

/**
 * Comibnes array of middleware using OR logic. Only fails if ALL functions fail (either by throwing or calling next(error))
 *
 * Each middleware will receive a different req object, no not rely on it to be shared among them
 *
 * @param {Function[]} Array of express middleware to be run
 * @param {object} Options:
 *  - error_code: error_code in case of error (default: ErrorTypes.VALIDATION_ERROR)
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
        if (success) return next();
        try {
            await middleware(req, res, (error) => {
                if (error) errors.push(error);
                else success = true;
            });
        } catch (err) {
            errors.push(err);
        }
    }

    if (errors.length) {
        return next(new APIError(status_code, error_code, msg, { or: errors.map((e) => e.toObject()) }));
    } else {
        return next();
    }
};

module.exports = {
    or,
};
