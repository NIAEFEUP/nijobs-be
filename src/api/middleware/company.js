const { ErrorTypes } = require("./errorHandler");
const HTTPStatus = require("http-status-codes");
const CompanyService = require("../../services/company");
const CompanyConstants = require("../../models/constants/Company");

const isCompanyRep = (req, res, next) => {
    if (!req.user.company) {
        return res.status(HTTPStatus.UNAUTHORIZED).json({
            reason: "The user is not a company representative",
            error_code: ErrorTypes.FORBIDDEN,
        });
    }

    return next();
};

const canCreateOffer = async (req, res, next) => {
    const companyOffers = await (new CompanyService()).getOffers(req.owner);

    if (companyOffers.length + 1 > CompanyConstants.offers.maximum_count) {
        return res.status(HTTPStatus.BAD_REQUEST).json({
            reason: `Number of offers limit reached! Can't have more than ${CompanyConstants.offers.maximum_count} active offers`,
            error_code: ErrorTypes.VALIDATION_ERROR,
        });
    }

    return next();
};

module.exports = {
    isCompanyRep,
    canCreateOffer,
};
