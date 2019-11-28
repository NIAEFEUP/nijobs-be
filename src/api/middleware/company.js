const { ErrorTypes } = require("./errorHandler");

const isCompanyRep = (req, res, next) => {
    if (!req.user.company) {
        return res.status(401).json({
            reason: "The user is not a company representative",
            error_code: ErrorTypes.FORBIDDEN,
        });
    }

    return next();
};


module.exports = { isCompanyRep };
