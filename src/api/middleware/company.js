const { ErrorTypes, APIError } = require("./errorHandler");
const HTTPStatus = require("http-status-codes");
const { concurrentOffersNotExceeded } = require("./validators/validatorUtils");
const ValidationReasons = require("./validators/validationReasons");
const CompanyConstants = require("../../models/constants/Company");
const Offer = require("../../models/Offer");
const CompanyService = require("../../services/company");
const OfferService = require("../../services/offer");

const verifyMaxConcurrentOffers = (owner, publishDate, publishEndDate, offerId) => async (req, res, next) => {

    const limitNotReached = await concurrentOffersNotExceeded(Offer)(
        owner,
        publishDate,
        publishEndDate,
        offerId
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

const verifyMaxConcurrentOffersOnCreate = (req, res, next) => {

    if (req.body?.isHidden) return next();

    const owner = req.targetOwner;
    const publishDate = req.body.publishDate;
    const publishEndDate = req.body.publishEndDate;

    return verifyMaxConcurrentOffers(owner, publishDate, publishEndDate)(req, res, next);

};

const verifyMaxConcurrentOffersOnEdit = async (req, res, next) => {

    if (req.body?.isHidden) return next();

    try {

        const offer = await (new OfferService()).getOfferById(req.params.offerId, req.user);

        if (!offer)
            throw new APIError(HTTPStatus.NOT_FOUND, ErrorTypes.VALIDATION_ERROR, ValidationReasons.OFFER_NOT_FOUND(req.params.offerId));

        const owner = offer.owner;
        const publishDate =  req.body.publishDate || offer.publishDate;
        const publishEndDate = req.body.publishEndDate || offer.publishEndDate;

        return verifyMaxConcurrentOffers(owner, publishDate, publishEndDate, offer._id)(req, res, next);

    } catch (err) {
        console.error(err);
        return next(err);
    }

};

const profileNotComplete = async (req, res, next) => {
    const company = await (new CompanyService()).findById(req.targetOwner, true);
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
    const company = await (new CompanyService()).findById(req.targetOwner, true);
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

const canDisable = async (req, res, next) => {
    const company = await (new CompanyService()).findById(req.body.owner, true);
    if (company.isDisabled) {
        return next(new APIError(
            HTTPStatus.FORBIDDEN,
            ErrorTypes.FORBIDDEN,
            ValidationReasons.COMPANY_DISABLED
        ));
    }
    return next();
};

const canEnable = async (req, res, next) => {
    const company = await (new CompanyService()).findById(req.body.owner, true);
    if (!company.isDisabled) {
        return next(new APIError(
            HTTPStatus.FORBIDDEN,
            ErrorTypes.FORBIDDEN,
            ValidationReasons.COMPANY_ENABLED
        ));
    }
    return next();
};

const validCompany = async (req, res, next) => {
    const company = await (new CompanyService()).findById(req.body.owner, true);
    if (!req.hasAdminPrivileges && company._id.toString() !== req.user?.company?._id.toString()) {
        return next(new APIError(
            HTTPStatus.FORBIDDEN,
            ErrorTypes.FORBIDDEN,
            ValidationReasons.INVALID_COMPANY
        ));
    }
    return next();
};

module.exports = {
    verifyMaxConcurrentOffers,
    verifyMaxConcurrentOffersOnCreate,
    verifyMaxConcurrentOffersOnEdit,
    profileNotComplete,
    profileComplete,
    isNotBlocked,
    canDisable,
    canEnable,
    validCompany,
};
