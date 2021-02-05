const HTTPStatus = require("http-status-codes");
const { APIError, ErrorTypes } = require("./errorHandler");
const ValidationReasons = require("./validators/validationReasons");


const DEFAULT_ERROR_CODE = ErrorTypes.VALIDATION_ERROR;
const DEFAULT_ERROR_MSG = ValidationReasons.UNKNOWN;
const DEFAULT_STATUS_CODE = HTTPStatus.BAD_REQUEST;

TODO 
* ADD TESTS
* REFACOTR EXISTING OR* MIDDLEWARE TO USE THIS
* REFACTOR ALL MIDDLEWARE TO RETURN NEXT WITH ERROR


const or = (
    [...middlewares],
    {
        error_code = DEFAULT_ERROR_CODE,
        msg = DEFAULT_ERROR_MSG,
        status_code = DEFAULT_STATUS_CODE
    } = {}
) => async (req, res, next) => {
    let success = false;
    const errors = [];
    for (const middleware of middlewares) {
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
        return next(new APIError(status_code, error_code, msg, { or: errors }));
    } else {
        return next();
    }
};

module.exports = {
    or
};
