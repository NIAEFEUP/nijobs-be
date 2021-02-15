const { ErrorTypes, APIError } = require("./errorHandler");
const HTTPStatus = require("http-status-codes");
const { concurrentOffersNotExceeded } = require("./validators/validatorUtils");
const ValidationReasons = require("./validators/validationReasons");
const CompanyConstants = require("../../models/constants/Company");
const Offer = require("../../models/Offer");
const CompanyService = require("../../services/company");

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

const profileNotComplete = async (req, res, next) => {
    const company = await (new CompanyService()).findById(req.user.company);
    if (company.hasFinishedRegistration) {
        return res
            .status(HTTPStatus.FORBIDDEN)
            .json({
                reason: ValidationReasons.REGISTRATION_FINISHED,
                error_code: ErrorTypes.FORBIDDEN
            });
    }
    return next();

};


module.exports = {
    verifyMaxConcurrentOffers,
    profileNotComplete
};
