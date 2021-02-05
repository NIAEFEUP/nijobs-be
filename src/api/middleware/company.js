const { ErrorTypes, buildErrorResponse } = require("./errorHandler");
const HTTPStatus = require("http-status-codes");
const { concurrentOffersNotExceeded } = require("./validators/validatorUtils");
const ValidationReasons = require("./validators/validationReasons");
const CompanyConstants = require("../../models/constants/Company");
const Offer = require("../../models/Offer");

const isCompanyRep = (req, res, next) => {
    if (!req.user.company) {
        return res.status(HTTPStatus.UNAUTHORIZED).json(
            buildErrorResponse(
                ErrorTypes.FORBIDDEN,
                ["The user is not a company representative"]
            )
        );
    }

    return next();
};

const verifyMaxConcurrentOffers = async (req, res, next) => {
    const limitNotReached = await concurrentOffersNotExceeded(Offer)(req.body.owner, req.body.publishDate, req.body.publishEndDate);

    if (!limitNotReached) {
        return res.status(HTTPStatus.CONFLICT).json(
            buildErrorResponse(
                ErrorTypes.VALIDATION_ERROR,
                [ValidationReasons.MAX_CONCURRENT_OFFERS_EXCEEDED(CompanyConstants.offers.max_concurrent)]
            )
        );
    }
    return next();
};


module.exports = {
    isCompanyRep,
    verifyMaxConcurrentOffers
};
