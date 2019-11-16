const { ErrorTypes } = require("./errorHandler");
const config = require("../../config/env");

// Middleware to require login in an endpoint
const authRequired = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({
        reason: "Must be logged in",
        error_code: ErrorTypes.FORBIDDEN,
    });
};

// Eventually should be done via a session in an admin account, but at least this will work for now, before a permission system is added
const isAdmin = (req, res, next) => {
    if (req.body.admin_token !== config.admin_token) {
        return res.status(401).json({
            reason: "Invalid admin token",
            error_code: ErrorTypes.FORBIDDEN,
        });
    }

    return next();
};

module.exports = {
    authRequired,
    isAdmin,
};
