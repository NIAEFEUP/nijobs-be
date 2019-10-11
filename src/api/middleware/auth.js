const { ErrorTypes } = require("./errorHandler");

// Middleware to require login in an endpoint
const authRequired = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({
        success: false,
        reason: "Must be logged in",
        code: ErrorTypes.FORBIDDEN,
    });
};

module.exports = { authRequired };
