const HTTPStatus = require("http-status-codes");
const { validationResult } = require("express-validator");
const { ensureArray } = require("./validators/validatorUtils");
const ValidationReasons = require("./validators/validationReasons");

const buildErrorResponse = (error_code, errors) => ({
    error_code,
    errors: ensureArray(errors),
});

class APIError extends Error {
    constructor(status_code, error_code, info, payload) {
        super(info);
        // info: array of errors or error message
        this.errors = Array.isArray(info) ? info : [{ msg: info }];
        this.status_code = status_code;
        this.error_code = error_code;
        this.payload = payload;
    }

    toObject() {
        return { ...buildErrorResponse(this.error_code, this.errors), ...this.payload };
    }

    sendResponse(res) {
        return res.status(this.status_code).json(this.toObject());
    }
}

class UnknownAPIError extends APIError {
    constructor() {
        super(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            ErrorTypes.UNEXPECTED_ERROR,
            ValidationReasons.UNKNOWN
        );
    }
}

const ErrorTypes = Object.freeze({
    VALIDATION_ERROR: 1,
    // Possibly nested in the future
    FILE_ERROR: 2,
    FORBIDDEN: 3,
    UNEXPECTED_ERROR: 99,
});

// Automatically run validators in order to have a standardized error response
const useExpressValidators = (validators) => async (req, res, next) => {
    await Promise.all(validators.map((validator) => validator.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    return next(new APIError(HTTPStatus.UNPROCESSABLE_ENTITY, ErrorTypes.VALIDATION_ERROR, errors.array()));
};

/**
 * Converts error to UnknownAPIError if it's not an instance of APIError
 * @param {*} error
 */
const hideInsecureError = (error) => {
    if (error instanceof APIError) return error;
    else return new UnknownAPIError();
};

const defaultErrorHandler = (err, req, res, _) => {
    if (!(err instanceof APIError)) console.error("UNEXPECTED ERROR:", err);
    hideInsecureError(err).sendResponse(res);
};


module.exports = {
    defaultErrorHandler,
    hideInsecureError,
    ErrorTypes,
    useExpressValidators,
    buildErrorResponse,
    APIError,
    UnknownAPIError
};
