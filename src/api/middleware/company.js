const { ErrorTypes } = require("./errorHandler");
const HTTPStatus = require("http-status-codes");
const CompanyService = require("../../services/company");
const CompanyConstants = require("../../models/constants/Company");
const ValidationReasons = require("./validators/validationReasons");

const isCompanyRep = (req, res, next) => {
    if (!req.user.company) {
        return res.status(HTTPStatus.UNAUTHORIZED).json({
            reason: "The user is not a company representative",
            error_code: ErrorTypes.FORBIDDEN,
        });
    }

    return next();
};

const verifyMaxConcurrentOffers = async (req, res, next) => {
    const concurrentOffers = await (new CompanyService()).
        getOffersInTimePeriod(req.body.owner, req.body.publishDate, req.body.publishEndDate);

    if (concurrentOffers.length >= CompanyConstants.offers.max_concurrent) {
        return res.status(HTTPStatus.CONFLICT).json({
            reason: ValidationReasons.MAX_CONCURRENT_OFFERS_EXCEEDED(CompanyConstants.offers.max_concurrent),
            error_code: ErrorTypes.VALIDATION_ERROR
        });
    }
    return next();
};


module.exports = {
    isCompanyRep,
    verifyMaxConcurrentOffers
};
