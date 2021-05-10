const { ErrorTypes, APIError } = require("./errorHandler");
const HTTPStatus = require("http-status-codes");
const { concurrentOffersNotExceeded } = require("./validators/validatorUtils");
const ValidationReasons = require("./validators/validationReasons");
const CompanyConstants = require("../../models/constants/Company");
const Offer = require("../../models/Offer");
const CompanyService = require("../../services/company");

const verifyMaxConcurrentOffers = (owner, publishDate, publishEndDate) => async (req, res, next) => {
    const limitNotReached = await concurrentOffersNotExceeded(Offer)(
        owner,
        publishDate || req.body.publishDate,
        publishEndDate || req.body.publishEndDate
    );
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
    const company = await (new CompanyService()).findById(req.user.company, true);
    if (company.hasFinishedRegistration) {
        return next(new APIError(
            HTTPStatus.FORBIDDEN,
            ErrorTypes.FORBIDDEN,
            ValidationReasons.REGISTRATION_FINISHED
        ));
    }
    return next();
};

const profileComplete = async (req, res, next) => {
    const company = await (new CompanyService()).findById(req.body.owner, true);
    if (!company.hasFinishedRegistration) {
        return next(new APIError(
            HTTPStatus.FORBIDDEN,
            ErrorTypes.FORBIDDEN,
            ValidationReasons.REGISTRATION_NOT_FINISHED
        ));
    }
    return next();
};

const isNotBlocked = (owner) => async (req, res, next) => {
    const company = await (new CompanyService()).findById(owner, true);
    if (company.isBlocked) {
        return next(new APIError(
            HTTPStatus.FORBIDDEN,
            ErrorTypes.FORBIDDEN,
            ValidationReasons.COMPANY_BLOCKED
        ));
    }

    return next();
};

module.exports = {
    verifyMaxConcurrentOffers,
    profileNotComplete,
    profileComplete,
    isNotBlocked,
};
