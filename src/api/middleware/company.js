import HTTPStatus from "http-status-codes";
import { ErrorTypes, APIError } from "./errorHandler.js";
import { concurrentOffersNotExceeded } from "./validators/validatorUtils.js";
import ValidationReasons from "./validators/validationReasons.js";
import CompanyConstants from "../../models/constants/Company.js";
import Offer from "../../models/Offer.js";
import CompanyService from "../../services/company.js";
import OfferService from "../../services/offer.js";

export const verifyMaxConcurrentOffers = (owner, publishDate, publishEndDate, offerId) => async (req, res, next) => {

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

export const verifyMaxConcurrentOffersOnCreate = (req, res, next) => {

    if (req.body?.isHidden) return next();

    const owner = req.targetOwner;
    const publishDate = req.body.publishDate;
    const publishEndDate = req.body.publishEndDate;

    return verifyMaxConcurrentOffers(owner, publishDate, publishEndDate)(req, res, next);

};

export const verifyMaxConcurrentOffersOnEdit = async (req, res, next) => {

    if (req.body?.isHidden) return next();

    try {

        const offer = await (new OfferService()).getOfferById(req.params.offerId, req.targetOwner, req.hasAdminPrivileges);

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

export const profileNotComplete = async (req, res, next) => {
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

export const profileComplete = async (req, res, next) => {
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

export const isNotBlocked = (owner) => async (req, res, next) => {
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

export const isNotDisabled = (owner) => async (req, res, next) => {
    const company = await (new CompanyService()).findById(owner, true);
    if (company.isDisabled) {
        return next(new APIError(
            HTTPStatus.FORBIDDEN,
            ErrorTypes.FORBIDDEN,
            ValidationReasons.COMPANY_DISABLED
        ));
    }
    return next();
};

export const canManageAccountSettings = (companyId) => async (req, res, next) => {
    const company = await (new CompanyService()).findById(companyId, true);

    // only god or the same company can change account settings
    if (!req.hasAdminPrivileges && company._id.toString() !== req.targetOwner) {
        return next(new APIError(
            HTTPStatus.FORBIDDEN,
            ErrorTypes.FORBIDDEN,
            ValidationReasons.INSUFFICIENT_PERMISSIONS_COMPANY_SETTINGS
        ));
    }
    return next();
};
