const { ErrorTypes } = require("./errorHandler");

const belongsToCompany = (company_id) =>  (req, res, next) => {
    if (!req.user.company ===  company_id) {
        return res.status(401).json({
            reason: "The user does not have access to the company",
            error_code: ErrorTypes.FORBIDDEN,
        });
    }

    return next();
};


module.exports = { belongsToCompany };
