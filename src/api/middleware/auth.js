const ERROR_TYPES = require("../routes/errors/errorHandler");

// Middleware to require login in an endpoint
const authRequired = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({
        success: false,
        reason: "Must be logged in",
        code: ERROR_TYPES.FORBIDDEN,
    });
};

module.exports = { authRequired };
