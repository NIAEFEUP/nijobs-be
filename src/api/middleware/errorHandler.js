const HTTPStatus = require("http-status-codes");
const { validationResult } = require("express-validator");
const { ensureArray } = require("./validators/validatorUtils");
const ValidationReasons = require("./validators/validationReasons");

const buildErrorResponse = (error_code, errors) => ({
    error_code,
    errors: ensureArray(errors),
});


class APIError extends Error {
    constructor(status_code, error_code, msg, payload) {
        super(msg);
        this.status_code = status_code;
        this.error_code = error_code;
        this.payload = payload;
    }

    toObject() {
        console.log("TOOBJECT", buildErrorResponse(this.error_code, [this.message]));
        return { ...buildErrorResponse(this.error_code, [this.message]), ...this.payload };
    }

    sendResponse(res) {
        return res.status(this.status_code).json(this.toObject());
    }


}

const ErrorTypes = Object.freeze({
    VALIDATION_ERROR: 1,
    // Possibly nested in the future
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

    return res
        .status(HTTPStatus.UNPROCESSABLE_ENTITY)
        .json(buildErrorResponse(ErrorTypes.VALIDATION_ERROR, errors.array()));
};

const defaultErrorHandler = (err, req, res, _) => {
    console.error("UNEXPECTED ERROR:", err instanceof APIError, err);

    if (err instanceof APIError) return err.sendResponse(res);
    else return (new APIError(
        HTTPStatus.INTERNAL_SERVER_ERROR,
        ErrorTypes.UNEXPECTED_ERROR,
        ValidationReasons.UNKNOWN)
    ).sendResponse(res);
};


module.exports = {
    defaultErrorHandler,
    ErrorTypes,
    useExpressValidators,
    buildErrorResponse,
    APIError
};
