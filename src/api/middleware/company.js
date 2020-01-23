const { ErrorTypes } = require("./errorHandler");
const HTTPStatus = require("http-status-codes");

const isCompanyRep = (req, res, next) => {
    if (!req.user.company) {
        return res.status(HTTPStatus.UNAUTHORIZED).json({
            reason: "The user is not a company representative",
            error_code: ErrorTypes.FORBIDDEN,
        });
    }

    return next();
};


module.exports = { isCompanyRep };
