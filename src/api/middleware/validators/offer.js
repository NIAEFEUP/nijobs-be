import { body, query, param } from "express-validator";
import HTTPStatus from "http-status-codes";

import { useExpressValidators, APIError, ErrorTypes } from "../errorHandler.js";
import ValidationReasons from "./validationReasons.js";
import { valuesInSet, ensureArray, isObjectId, maxHTMLContentLength, normalizeDate } from "./validatorUtils.js";
import JobTypes from "../../../models/constants/JobTypes.js";
import { FieldTypes, MIN_FIELDS, MAX_FIELDS } from "../../../models/constants/FieldTypes.js";
import { TechnologyTypes, MIN_TECHNOLOGIES, MAX_TECHNOLOGIES } from "../../../models/constants/TechnologyTypes.js";
import OfferService from "../../../services/offer.js";
import OfferConstants from "../../../models/constants/Offer.js";
import Company from "../../../models/Company.js";
import Offer, { validatePublishEndDateLimit } from "../../../models/Offer.js";
import {
    MONTH_IN_MS,
    OFFER_MAX_LIFETIME_MONTHS
} from "../../../models/constants/TimeConstants.js";
import * as companyMiddleware from "../company.js";
import config from "../../../config/env.js";
import { when } from "../utils.js";

const mustSpecifyJobMinDurationIfJobMaxDurationSpecified = (jobMaxDuration, { req }) => {

    const { jobMinDuration } = req.body;

    if (!jobMinDuration) {
        throw new Error(ValidationReasons.JOB_MIN_DURATION_NOT_SPECIFIED);
    }
    return true;
};

const jobMaxDurationGreaterOrEqualThanJobMinDuration = (jobMaxDuration, { req }) => {

    const { jobMinDuration } = req.body;

    if (jobMinDuration > jobMaxDuration) {
        throw new Error(ValidationReasons.MUST_BE_AFTER("jobMinDuration"));
    }
    return true;
};

const publishEndDateAfterPublishDate = (publishEndDateCandidate, { req }) => {
    const { publishDate: publishDateCandidate } = req.body;
    // Default values and also handling if it is string or date object
    const publishDate = publishDateCandidate || (new Date(Date.now())).toISOString();

    if (publishEndDateCandidate <= publishDate) {
        // end date is earlier than publish date, error!
        throw new Error(ValidationReasons.MUST_BE_AFTER("publishDate"));
    }

    // Returning truthy value to indicate no error ocurred
    return true;
};

const publishEndDateLimit = (publishEndDateCandidate, { req }) => {
    const { publishDate: publishDateCandidate } = req.body;
    // Default values and also handling if it is string or date object
    const publishDate = publishDateCandidate || (new Date(Date.now()));
    if (!validatePublishEndDateLimit(new Date(Date.parse(publishDate)), new Date(Date.parse(publishEndDateCandidate)))) {
        const maxPublishEndDate = new Date(Date.parse(publishDate) + (MONTH_IN_MS * OFFER_MAX_LIFETIME_MONTHS)).toISOString();
        throw new Error(ValidationReasons.MUST_BE_BEFORE(maxPublishEndDate));
    }

    // Returning truthy value to indicate no error ocurred
    return true;
};

const checkBooleanField = (booleanFieldCandidate) => (typeof booleanFieldCandidate === "boolean");

export const create = useExpressValidators([
    body("title", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ min: OfferConstants.title.min_length }).withMessage(ValidationReasons.TOO_SHORT(OfferConstants.title.min_length))
        .isLength({ max: OfferConstants.title.max_length }).withMessage(ValidationReasons.TOO_LONG(OfferConstants.title.max_length))
        .trim(),

    body("publishDate", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .customSanitizer(normalizeDate),

    body("publishEndDate", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .isAfter().withMessage(ValidationReasons.DATE_EXPIRED).bail()
        .customSanitizer(normalizeDate)
        .custom(publishEndDateAfterPublishDate)
        .custom(publishEndDateLimit),


    body("jobMinDuration", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT),

    body("jobMaxDuration", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT)
        .custom(mustSpecifyJobMinDurationIfJobMaxDurationSpecified).bail()
        .custom(jobMaxDurationGreaterOrEqualThanJobMinDuration),

    body("jobStartDate", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .customSanitizer(normalizeDate)
        .toDate(),

    body("description", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .custom(maxHTMLContentLength(OfferConstants.description.max_length))
        .trim(),

    body("contacts", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isArray({ min: OfferConstants.contacts.min_length })
        .withMessage(ValidationReasons.TOO_SHORT(OfferConstants.contacts.min_length)),

    body("isPaid", ValidationReasons.DEFAULT)
        .optional()
        .custom(checkBooleanField).withMessage(ValidationReasons.BOOLEAN),

    body("vacancies", ValidationReasons.DEFAULT)
        .optional()
        .isInt({ min: OfferConstants.vacancies.min })
        .withMessage(ValidationReasons.MIN(OfferConstants.vacancies.min)),

    body("jobType", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING).bail()
        .isIn(JobTypes).withMessage(ValidationReasons.IN_ARRAY(JobTypes)),

    body("fields", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isArray({ min: MIN_FIELDS, max: MAX_FIELDS })
        .withMessage(ValidationReasons.ARRAY_SIZE(MIN_FIELDS, MAX_FIELDS))
        .bail()
        .custom(valuesInSet(FieldTypes)),

    body("technologies", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isArray({ min: MIN_TECHNOLOGIES, max: MAX_TECHNOLOGIES })
        .withMessage(ValidationReasons.ARRAY_SIZE(MIN_TECHNOLOGIES, MAX_TECHNOLOGIES))
        .bail()
        .custom(valuesInSet(TechnologyTypes)),

    body("isHidden", ValidationReasons.DEFAULT)
        .optional()
        .custom(checkBooleanField).withMessage(ValidationReasons.BOOLEAN),

    body("owner", ValidationReasons.DEFAULT)
        .custom(async (owner, { req }) => {

            // When it reaches this validation, the user is either company or god
            if (req?.user?.company) return true;

            if (!owner) throw new Error(ValidationReasons.REQUIRED);

            try {
                if (await Company.findById(owner) === null) throw new Error();
            } catch (err) {
                console.error(err);
                // Also catches any fail to the DB
                throw new Error(ValidationReasons.COMPANY_NOT_FOUND(owner));
            }

            // Returning truthy value to indicate no error ocurred
            return true;
        }),

    body("location", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .trim(),

    // TODO: Figure out how to handle this field
    // We should probably only receive the array part and inject the type that PointSchema requires in a custom sanitizer
    body("coordinates", ValidationReasons.DEFAULT)
        .optional()
        .isArray(),

    body("requirements", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isArray({ min: OfferConstants.requirements.min_length })
        .withMessage(ValidationReasons.TOO_SHORT(OfferConstants.requirements.min_length)),
]);

const jobMinDurationEditable = async (jobMinDurationCandidate, { req }) => {
    try {
        const offer = await (new OfferService()).getOfferById(req.params.offerId, req.targetOwner, req.hasAdminPrivileges);

        const { jobMaxDuration: jobMaxDurationCandidate } = req.body;

        // If the new jobMinDuration is after the new jobMaxDuration, the verification will be done in jobMaxDurationEditable
        if ((offer.jobMaxDuration && jobMinDurationCandidate > offer.jobMaxDuration.toString())
            && !jobMaxDurationCandidate) {

            // end date is earlier than publish date, error!
            throw new Error(ValidationReasons.MUST_BE_BEFORE("jobMaxDuration"));
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
    return true;
};

const jobMaxDurationEditable = async (jobMaxDurationCandidate, { req }) => {
    try {
        const offer = await (new OfferService()).getOfferById(req.params.offerId, req.targetOwner, req.hasAdminPrivileges);

        const { jobMinDuration: jobMinDurationCandidate } = req.body;

        const jobMinDuration = jobMinDurationCandidate || offer.jobMinDuration.toString();

        if (!jobMinDuration) {
            throw new Error(ValidationReasons.JOB_MIN_DURATION_NOT_SPECIFIED);
        }

        if (jobMinDuration > jobMaxDurationCandidate) {

            throw new Error(ValidationReasons.MUST_BE_AFTER("jobMinDuration"));
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
    return true;
};

const publishDateEditable = async (publishDateCandidate, { req }) => {
    try {
        const offer = await (new OfferService()).getOfferById(req.params.offerId, req.targetOwner, req.hasAdminPrivileges);
        const { publishEndDate: publishEndDateCandidate } = req.body;

        // If the new publishEndDate is after the new publishDate, the verification will be done in publishEndDate
        if (publishDateCandidate >= offer.publishEndDate.toISOString() &&
            !publishEndDateCandidate) {

            // end date is earlier than publish date, error!
            throw new Error(ValidationReasons.MUST_BE_BEFORE("publishEndDate"));
        }

    } catch (err) {
        console.error(err);
        // Also catches any fail to the DB
        throw err;
    }
    return true;
};

const publishEndDateEditableAfterPublishDate = async (publishEndDateCandidate, { req }) => {
    try {
        // Default values and also handling if it is string or date object
        const offer = await (new OfferService()).getOfferById(req.params.offerId, req.targetOwner, req.hasAdminPrivileges);
        const { publishDate: publishDateCandidate } = req.body;

        let publishDate;

        // Verifies if it's possible to convert the date
        // If not, the validator will stop running without an error message because it was already thrown in publishDate validator
        if (publishDateCandidate) {
            try {
                publishDate = (new Date(Date.parse(publishDateCandidate))).toISOString();
            } catch {
                return true;
            }
        }
        publishDate = publishDate || offer.publishDate.toISOString();

        if (publishEndDateCandidate <= publishDate) {
            throw new Error(ValidationReasons.MUST_BE_AFTER("publishDate"));
        }
    } catch (err) {
        console.error(err);
        throw err;
    }
    return true;
};

const publishEndDateEditableLimit = async (publishEndDateCandidate, { req }) => {
    try {
        // Default values and also handling if it is string or date object
        const offer = await (new OfferService()).getOfferById(req.params.offerId, req.targetOwner, req.hasAdminPrivileges);
        const { publishDate: publishDateCandidate } = req.body;

        let publishDate;

        // Verifies if it's possible to convert the date
        // If not, the validator will stop running without an error message because it was already thrown in publishDate validator
        if (publishDateCandidate) {
            try {
                publishDate = (new Date(Date.parse(publishDateCandidate))).toISOString();
            } catch {
                return true;
            }
        }
        publishDate = publishDate || offer.publishDate.toISOString();

        if (!validatePublishEndDateLimit(new Date(Date.parse(publishDate)), new Date(Date.parse(publishEndDateCandidate)))) {
            const maxPublishEndDate = new Date(Date.parse(publishDate) + (MONTH_IN_MS * OFFER_MAX_LIFETIME_MONTHS)).toISOString();
            throw new Error(ValidationReasons.MUST_BE_BEFORE(maxPublishEndDate));
        }

    } catch (err) {
        console.error(err);
        throw err;
    }

    // Returning truthy value to indicate no error ocurred
    return true;
};

const existingOfferId = async (offerId, { req }) => {
    try {
        const offer = await (new OfferService()).getOfferById(offerId, req.targetOwner, req.hasAdminPrivileges);
        if (!offer) throw new Error(ValidationReasons.OFFER_NOT_FOUND(offerId));
    } catch (err) {
        console.error(err);
        throw err;
    }

    return true;
};

export const isExistingOffer = useExpressValidators([
    param("offerId", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .custom(isObjectId).withMessage(ValidationReasons.OBJECT_ID).bail()
        .custom(existingOfferId),
]);

export const edit = useExpressValidators([
    body("title", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ min: OfferConstants.title.min_length }).withMessage(ValidationReasons.TOO_SHORT(OfferConstants.title.min_length))
        .isLength({ max: OfferConstants.title.max_length }).withMessage(ValidationReasons.TOO_LONG(OfferConstants.title.max_length))
        .trim(),

    body("publishDate", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .isAfter().withMessage(ValidationReasons.DATE_EXPIRED).bail()
        .customSanitizer(normalizeDate)
        .custom(publishDateEditable),

    body("publishEndDate", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .isAfter().withMessage(ValidationReasons.DATE_EXPIRED).bail()
        .customSanitizer(normalizeDate)
        .custom(publishEndDateEditableAfterPublishDate)
        .custom(publishEndDateEditableLimit),

    body("jobMinDuration", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT)
        .custom(jobMinDurationEditable).bail(),

    body("jobMaxDuration", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT)
        .custom(jobMaxDurationEditable),

    body("jobStartDate", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .customSanitizer(normalizeDate)
        .toDate(),

    body("description", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING)
        .custom(maxHTMLContentLength(OfferConstants.description.max_length))
        .trim(),

    body("contacts", ValidationReasons.DEFAULT)
        .optional()
        .isArray({ min: OfferConstants.contacts.min_length })
        .withMessage(ValidationReasons.TOO_SHORT(OfferConstants.contacts.min_length)),

    body("isPaid", ValidationReasons.DEFAULT)
        .optional()
        .custom(checkBooleanField).withMessage(ValidationReasons.BOOLEAN),

    body("vacancies", ValidationReasons.DEFAULT)
        .optional()
        .isInt({ min: OfferConstants.vacancies.min })
        .withMessage(ValidationReasons.MIN(OfferConstants.vacancies.min)),

    body("jobType", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING).bail()
        .isIn(JobTypes).withMessage(ValidationReasons.IN_ARRAY(JobTypes)),

    body("fields", ValidationReasons.DEFAULT)
        .optional()
        .isArray({ min: MIN_FIELDS, max: MAX_FIELDS })
        .withMessage(ValidationReasons.ARRAY_SIZE(MIN_FIELDS, MAX_FIELDS))
        .bail()
        .custom(valuesInSet(FieldTypes)),

    body("technologies", ValidationReasons.DEFAULT)
        .optional()
        .isArray({ min: MIN_TECHNOLOGIES, max: MAX_TECHNOLOGIES })
        .withMessage(ValidationReasons.ARRAY_SIZE(MIN_TECHNOLOGIES, MAX_TECHNOLOGIES))
        .bail()
        .custom(valuesInSet(TechnologyTypes)),

    body("isHidden", ValidationReasons.DEFAULT)
        .optional()
        .custom(checkBooleanField).withMessage(ValidationReasons.BOOLEAN),

    body("location", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING)
        .trim(),
    body("requirements", ValidationReasons.DEFAULT)
        .optional()
        .isArray({ min: OfferConstants.requirements.min_length })
        .withMessage(ValidationReasons.TOO_SHORT(OfferConstants.requirements.min_length)),
    // TODO: Figure out how to handle this field
    // We should probably only receive the array part and inject the type that PointSchema requires in a custom sanitizer
    body("coordinates", ValidationReasons.DEFAULT)
        .optional()
        .isArray(),
]);

export const offersDateSanitizers = useExpressValidators([
    body("publishDate")
        .optional()
        .toDate(),
    body("publishEndDate")
        .optional()
        .toDate(),
]);

export const setDefaultValuesCreate = (req, res, next) => {
    if (!req.body?.publishDate) req.body.publishDate = new Date(Date.now()).toISOString();
    return next();
};

export const get = useExpressValidators([
    query("queryToken", ValidationReasons.DEFAULT)
        .optional()
        .custom(isObjectId).withMessage(ValidationReasons.OBJECT_ID).bail()
        .custom(existingOfferId)
        .custom(async (offerId, { req }) => {
            try {
                const offerService = new OfferService();
                const { value, ...filters } = req.query;

                if (!await offerService.doesOfferMatchFilters(offerId, filters)) {
                    throw new Error(ValidationReasons.OFFER_NOT_MATCHING_CRITERIA);
                }

                if (!value) return true;

                const score = await offerService.getTextSearchScoreById(offerId, value);
                if (score <= 0) throw new Error(ValidationReasons.OFFER_NOT_MATCHING_CRITERIA);
            } catch (err) {
                console.error(err);
                throw err;
            }

            return true;
        }),

    query("limit")
        .optional()
        .isInt({ min: 0, max: OfferService.MAX_OFFERS_PER_QUERY }).withMessage(ValidationReasons.INT)
        .toInt(),

    // we cant use .custom(checkBooleanField) because this is passed in the request query,
    // and will be parsed by express.json() into a string, so the default isBoolean check is more fit
    query("showHidden")
        .optional()
        .isBoolean().withMessage(ValidationReasons.BOOLEAN)
        .toBoolean(),

    query("jobType")
        .optional()
        .isString().withMessage(ValidationReasons.STRING).bail()
        .isIn(JobTypes).withMessage(ValidationReasons.IN_ARRAY(JobTypes)),

    query("jobMinDuration", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT).bail()
        .toInt(),

    query("jobMaxDuration", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT).bail()
        .toInt(),

    query("fields", ValidationReasons.DEFAULT)
        .optional()
        .customSanitizer(ensureArray)
        .isArray().withMessage(ValidationReasons.ARRAY).bail()
        .custom(valuesInSet((FieldTypes))),

    query("technologies", ValidationReasons.DEFAULT)
        .optional()
        .customSanitizer(ensureArray)
        .isArray().withMessage(ValidationReasons.ARRAY).bail()
        .custom(valuesInSet((TechnologyTypes))),
]);

export const validOfferId = useExpressValidators([
    param("offerId", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED)
        .custom(isObjectId).withMessage(ValidationReasons.OBJECT_ID),
]);

// Validator to check if the offer can be managed, checking hiddenOffer flag
export const canBeManaged = async (req, res, next) => {
    const offer = await Offer.findById(req.params.offerId);

    // Admin or gods can enable even if it was blocked by another admin
    if ((!req.user?.isAdmin && req.body.god_token !== config.god_token) &&
        offer.hiddenReason === OfferConstants.HiddenOfferReasons.ADMIN_BLOCK) {
        return next(new APIError(HTTPStatus.FORBIDDEN, ErrorTypes.FORBIDDEN, ValidationReasons.OFFER_BLOCKED_ADMIN));
    }

    return next();
};

export const canBeEnabled = async (req, res, next) => {
    const offer = await Offer.findById(req.params.offerId);

    return companyMiddleware.verifyMaxConcurrentOffers(offer.owner, offer.publishDate, offer.publishEndDate)(req, res, next);
};

// Validator to check if the offer is not already hidden
export const canHide = async (req, res, next) => {
    const offer = await Offer.findById(req.params.offerId);

    if (offer.isHidden) {
        return next(new APIError(HTTPStatus.FORBIDDEN, ErrorTypes.FORBIDDEN, ValidationReasons.OFFER_HIDDEN));
    }

    return next();
};

export const disable = useExpressValidators([
    body("adminReason")
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING).bail()
        .trim(),
]);

// Validator to check if the offer is not already disabled by admin
export const canDisable = async (req, res, next) => {
    const offer = await Offer.findById(req.params.offerId);

    if (offer.isHidden && offer.hiddenReason === OfferConstants.HiddenOfferReasons.ADMIN_BLOCK) {
        return next(new APIError(HTTPStatus.FORBIDDEN, ErrorTypes.FORBIDDEN, ValidationReasons.OFFER_HIDDEN));
    }

    return next();
};

export const offerOwnerNotBlocked = async (req, res, next) => {
    const offer = await Offer.findById(req.params.offerId);

    return companyMiddleware.isNotBlocked(offer.owner)(req, res, next);
};

export const offerOwnerNotDisabled = async (req, res, next) => {
    const offer = await Offer.findById(req.params.offerId);

    return when(
        // if we are a company editing/hiding an offer, we can't be disabled, but admins/gods can do so on our behalf
        !req.hasAdminPrivileges,
        (req, res, next) => companyMiddleware.isNotDisabled(offer.owner)(req, res, next))(req, res, next);
};
