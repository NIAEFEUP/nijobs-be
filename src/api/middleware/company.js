const { ErrorTypes, APIError } = require("./errorHandler");
const HTTPStatus = require("http-status-codes");
const { concurrentOffersNotExceeded } = require("./validators/validatorUtils");
const ValidationReasons = require("./validators/validationReasons");
const CompanyConstants = require("../../models/constants/Company");
const Offer = require("../../models/Offer");

const verifyMaxConcurrentOffers = async (req, res, next) => {
    const limitNotReached = await concurrentOffersNotExceeded(Offer)(req.body.owner, req.body.publishDate, req.body.publishEndDate);

    if (!limitNotReached) {
        return next(new APIError(
            HTTPStatus.CONFLICT,
            ErrorTypes.VALIDATION_ERROR,
            ValidationReasons.MAX_CONCURRENT_OFFERS_EXCEEDED(CompanyConstants.offers.max_concurrent)
        ));
    }
    return next();
};


module.exports = {
    verifyMaxConcurrentOffers
};
