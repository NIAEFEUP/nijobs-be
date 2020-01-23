const HTTPStatus = require("http-status-codes");
const { validationResult } = require("express-validator");

const { errorExtractor } = require("../../lib/dbErrorExtractor");

const ErrorTypes = Object.freeze({
    VALIDATION_ERROR: 1,
    // Possibly nested in the future
    DB_ERROR: 2,
    FORBIDDEN: 3,
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
        .json({
            error_code: ErrorTypes.VALIDATION_ERROR,
            errors: errors.array(),
        });
};

const dbHandler = () => (err, req, res, next) => {
    if (!err.hasOwnProperty("name") || err.name !== "MongoError") {
        return next(err);
    }

    const result = {
        error_code: ErrorTypes.DB_ERROR,
        errors: [errorExtractor(err)],
    };

    return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send(result);
};

module.exports = {
    dbHandler,
    ErrorTypes,
    useExpressValidators,
};
