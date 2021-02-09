const { body, query, param } = require("express-validator");

const { useExpressValidators, buildErrorResponse } = require("../errorHandler");
const ValidationReasons = require("./validationReasons");
const { valuesInSet, ensureArray } = require("./validatorUtils");
const JobTypes = require("../../../models/constants/JobTypes");
const { FieldTypes, MIN_FIELDS, MAX_FIELDS } = require("../../../models/constants/FieldTypes");
const { TechnologyTypes, MIN_TECHNOLOGIES, MAX_TECHNOLOGIES } = require("../../../models/constants/TechnologyTypes");
const OfferService = require("../../../services/offer");
const OfferConstants = require("../../../models/constants/Offer");
const Company = require("../../../models/Company");
const { isObjectId } = require("../validators/validatorUtils");
const Offer = require("../../../models/Offer");
const { ErrorTypes } = require("../errorHandler");
const HTTPStatus = require("http-status-codes");
const {
    HOUR_IN_MS,
    OFFER_EDIT_GRACE_PERIOD_HOURS,
} = require("../../../models/constants/TimeConstants");

const jobMaxDurationGreaterOrEqualThanJobMinDuration = (jobMaxDuration, { req }) => {
    try {
        const { jobMinDuration } = req.body;

        // jobMinDuration is required if jobMaxDuration was specified
        if (!jobMinDuration) {
            throw new Error(ValidationReasons.JOB_MIN_DURATION_NOT_SPECIFIED);
        }

        if (jobMinDuration > jobMaxDuration) {
            throw new Error(ValidationReasons.MUST_BE_AFTER("jobMinDuration"));
        }

        return true;

    } catch (err) {
        console.error(err);
        throw err;
    }
};

const create = useExpressValidators([
    body("title", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: OfferConstants.title.max_length }).withMessage(ValidationReasons.TOO_LONG(90))
        .trim(),

    body("publishDate", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail(),

    body("publishEndDate", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .isAfter().withMessage(ValidationReasons.DATE_EXPIRED).bail()
        .custom((publishEndDateCandidate, { req }) => {
            const { publishDate: publishDateCandidate } = req.body;
            // Default values and also handling if it is string or date object
            const publishDate = publishDateCandidate || (new Date(Date.now())).toISOString();

            if (publishEndDateCandidate <= publishDate) {
                // end date is earlier than publish date, error!
                throw new Error(ValidationReasons.MUST_BE_AFTER("publishDate"));
            }

            // Returning truthy value to indicate no error ocurred
            return true;
        }),

    body("jobMinDuration", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT),

    body("jobMaxDuration", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT)
        .custom(jobMaxDurationGreaterOrEqualThanJobMinDuration),

    body("jobStartDate", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE)
        .toDate(),

    body("description", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: OfferConstants.description.max_length }).withMessage(ValidationReasons.TOO_LONG(1500))
        .trim(),

    body("contacts", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isArray({ min: 1 })
        .withMessage(ValidationReasons.TOO_SHORT(1)),

    body("isPaid", ValidationReasons.DEFAULT)
        .optional()
        .isBoolean().withMessage(ValidationReasons.BOOLEAN),

    body("vacancies", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT),

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
        .isBoolean().withMessage(ValidationReasons.BOOLEAN),

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
        .isArray({ min: 1 })
        .withMessage(ValidationReasons.TOO_SHORT(1)),
]);

const jobMinDurationEditable = async (jobMinDurationCandidate, { req }) => {
    try {
        const offer = await (new OfferService()).getOfferById(req.params.offerId, req.user);

        const { jobMaxDuration: jobMaxDurationCandidate } = req.body;

        // If the new publishMinDuration is after the new publishMaxDuration, the verification will be done in publishMaxDurationEditable
        if (jobMinDurationCandidate > offer.jobMaxDuration.toString() &&
            !jobMaxDurationCandidate) {

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
        const offer = await (new OfferService()).getOfferById(req.params.offerId, req.user);

        const { jobMinDuration: jobMinDurationCandidate } = req.body;

        const jobMinDuration = jobMinDurationCandidate || offer.jobMinDuration.toString();
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
        const offer = await (new OfferService()).getOfferById(req.params.offerId, req.user);
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

const publishEndDateEditable = async (publishEndDateCandidate, { req }) => {
    try {
        // Default values and also handling if it is string or date object
        const offer = await (new OfferService()).getOfferById(req.params.offerId, req.user);
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
    // Returning truthy value to indicate no error ocurred
    return true;
};

const isExistingOffer = useExpressValidators([
    param("offerId", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .custom(isObjectId).withMessage(ValidationReasons.OBJECT_ID).bail()
        .custom(async (offerId, { req }) => {
            try {
                const offer = await (new OfferService()).getOfferById(offerId, req.user);
                if (!offer) throw new Error(ValidationReasons.OFFER_NOT_FOUND(offerId));
            } catch (err) {
                console.error(err);
                throw err;
            }

            return true;
        }),
]);

const edit = useExpressValidators([
    body("title", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: OfferConstants.title.max_length }).withMessage(ValidationReasons.TOO_LONG(90))
        .trim(),

    body("publishDate", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .isAfter().withMessage(ValidationReasons.DATE_EXPIRED).bail()
        .custom(publishDateEditable),

    body("publishEndDate", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .isAfter().withMessage(ValidationReasons.DATE_EXPIRED).bail()
        .custom(publishEndDateEditable),

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
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE)
        .toDate(),

    body("description", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING)
        .withMessage(ValidationReasons.TOO_LONG(OfferConstants.description.max_length))
        .trim(),

    body("contacts", ValidationReasons.DEFAULT)
        .optional()
        .isArray({ min: 1 })
        .withMessage(ValidationReasons.TOO_SHORT(1)),

    body("isPaid", ValidationReasons.DEFAULT)
        .optional()
        .isBoolean().withMessage(ValidationReasons.BOOLEAN),

    body("vacancies", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT),

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
        .isBoolean().withMessage(ValidationReasons.BOOLEAN),

    body("location", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING)
        .trim(),
    body("requirements", ValidationReasons.DEFAULT)
        .optional()
        .isArray({ min: 1 })
        .withMessage(ValidationReasons.TOO_SHORT(1)),
    // TODO: Figure out how to handle this field
    // We should probably only receive the array part and inject the type that PointSchema requires in a custom sanitizer
    body("coordinates", ValidationReasons.DEFAULT)
        .optional()
        .isArray(),
]);

const isEditable = async (req, res, next) => {
    const offer = await Offer.findById(req.params.offerId);
    const currentDate = new Date(Date.now());

    // Verify if offer editing grace period is over
    const timeDiff = currentDate - offer.createdAt;
    const diffInHours = timeDiff / HOUR_IN_MS;

    if (offer.publishEndDate.toISOString() <= currentDate.toISOString()) {
        return res.status(HTTPStatus.FORBIDDEN).json(
            buildErrorResponse(ErrorTypes.FORBIDDEN, [ValidationReasons.OFFER_EXPIRED(req.params.offerId)]));
    } else if (offer.publishDate.toISOString() <= currentDate.toISOString() && diffInHours > OFFER_EDIT_GRACE_PERIOD_HOURS) {
        return res.status(HTTPStatus.FORBIDDEN).json(
            buildErrorResponse(ErrorTypes.FORBIDDEN, [ValidationReasons.OFFER_EDIT_PERIOD_OVER(diffInHours.toFixed(2))]));
    }

    return next();
};

const offersDateSanitizers = useExpressValidators([
    body("publishDate")
        .optional()
        .toDate(),
    body("publishEndDate")
        .optional()
        .toDate(),
]);

const get = useExpressValidators([
    query("offset", ValidationReasons.DEFAULT)
        .optional()
        .isInt({ min: 0 }).withMessage(ValidationReasons.INT)
        .toInt(),

    query("limit")
        .optional()
        .isInt({ min: 0, max: OfferService.MAX_OFFERS_PER_QUERY }).withMessage(ValidationReasons.INT)
        .toInt(),

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

const getOfferById = useExpressValidators([
    param("offerId", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED)
        .custom(isObjectId).withMessage(ValidationReasons.OBJECT_ID),
]);

module.exports = {
    create,
    get,
    getOfferById,
    isExistingOffer,
    edit,
    offersDateSanitizers,
    isEditable,
};
