const HTTPStatus = require("http-status-codes");
const { validationResult } = require("express-validator");

const ErrorTypes = Object.freeze({
    VALIDATION_ERROR: 1,
    // Possibly nested in the future
    FORBIDDEN: 3,
    UNEXPECTED_ERROR: 99,
});

const buildErrorResponse = (error_code, errors) => ({
    error_code,
    errors,
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

const useExpressSanitizers = (sanitizers) => async (req, res, next) => {
    await Promise.all(sanitizers.map((sanitizer) => sanitizer.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    return res
        .status(HTTPStatus.UNPROCESSABLE_ENTITY)
        .json(buildErrorResponse(ErrorTypes.VALIDATION_ERROR, errors.array()));
};

const defaultErrorHandler = (err, req, res, _) => {
    console.error("UNEXPECTED ERROR:", err);

    const result = {
        error_code: ErrorTypes.UNEXPECTED_ERROR,
        errors: ["An unexpected error occured"],
    };
    return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send(result);
};

module.exports = {
    defaultErrorHandler,
    ErrorTypes,
    useExpressValidators,
    useExpressSanitizers,
    buildErrorResponse,
};
