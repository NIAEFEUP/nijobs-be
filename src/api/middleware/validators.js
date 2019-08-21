const ERROR_TYPES = require("../routes/errors/errorHandler");

// Middleware to require username and password (for register)
const register = (req, res, next) => {
    // Username is required
    if (!req.body.username) {
        return res.status(400).json({
            success: false,
            reason: "No username specified",
            error_code: ERROR_TYPES.MISSING_FIELD,
        });
    }

    // Password is required
    if (!req.body.password) {
        return res.status(400).json({
            success: false,
            reason: "No password specified",
            error_code: ERROR_TYPES.MISSING_FIELD,
        });
    }

    return next();
};

module.exports = {
    register,
};
