const { ErrorTypes } = require("./errorHandler");
const config = require("../../config/env");
const HTTPStatus = require("http-status-codes");

// Middleware to require login in an endpoint
const authRequired = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(HTTPStatus.UNAUTHORIZED).json({
        reason: "Must be logged in",
        error_code: ErrorTypes.FORBIDDEN,
    });
};

// Eventually should be done via a session in an god account, but at least this will work for now, before a permission system is added
const isGod = (req, res, next) => {
    if (req.body.god_token !== config.god_token) {
        return res.status(HTTPStatus.UNAUTHORIZED).json({
            reason: "Invalid god token",
            error_code: ErrorTypes.FORBIDDEN,
        });
    }

    return next();
};

const isCompanyOrGod = (req, res, next) => {
    if (req?.user?.company) return next();

    return isGod(req, res, next);
};

const isAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        return res.status(HTTPStatus.UNAUTHORIZED).json({
            reason: "The user is not an admin",
            error_code: ErrorTypes.FORBIDDEN,
        });
    }

    return next();
};

module.exports = {
    authRequired,
    isGod,
    isAdmin,
    isCompanyOrGod,
};
