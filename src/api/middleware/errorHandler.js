import HTTPStatus from "http-status-codes";
import { validationResult } from "express-validator";
import { ensureArray } from "./validators/validatorUtils.js";
import ValidationReasons from "./validators/validationReasons.js";
import  * as Sentry from "@sentry/node";

export const buildErrorResponse = (error_code, errors) => ({
    error_code,
    errors: ensureArray(errors),
});

export class APIError extends Error {
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

export class UnknownAPIError extends APIError {
    constructor() {
        super(
            HTTPStatus.INTERNAL_SERVER_ERROR,
            ErrorTypes.UNEXPECTED_ERROR,
            ValidationReasons.UNKNOWN
        );
    }
}

export const ErrorTypes = Object.freeze({
    VALIDATION_ERROR: 1,
    // Possibly nested in the future
    FILE_ERROR: 2,
    FORBIDDEN: 3,
    UNEXPECTED_ERROR: 99,
});

// Automatically run validators in order to have a standardized error response
export const useExpressValidators = (validators) => async (req, res, next) => {
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
export const hideInsecureError = (error) => {
    if (error instanceof APIError) return error;
    else return new UnknownAPIError();
};

export const defaultErrorHandler = (err, req, res, _) => {
    if (!(err instanceof APIError)) {
        Sentry.captureException(err);
        console.error("UNEXPECTED ERROR:", err);
    }
    hideInsecureError(err).sendResponse(res);
};
