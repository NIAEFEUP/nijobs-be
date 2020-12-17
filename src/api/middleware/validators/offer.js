const { body, query } = require("express-validator");

const { useExpressValidators } = require("../errorHandler");
const ValidationReasons = require("./validationReasons");
const { valuesInSet } = require("./validatorUtils");
const JobTypes = require("../../../models/constants/JobTypes");
const FieldTypes = require("../../../models/constants/FieldTypes");
const TechnologyTypes = require("../../../models/constants/TechnologyTypes");
const OfferService = require("../../../services/offer");
const OfferConstants = require("../../../models/constants/Offer");
const Company = require("../../../models/Company");

const create = useExpressValidators([
    body("title", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: OfferConstants.title.max_length }).withMessage(ValidationReasons.TOO_LONG(90))
        .trim(),

    body("publishDate", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .toDate(),

    body("publishEndDate", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .isAfter().withMessage(ValidationReasons.DATE_EXPIRED).bail()
        .custom((publishEndDateCandidate, { req }) => {
            const { publishDate: publishDateRaw } = req.body;
            // Default values and also handling if it is string or date object
            const publishDate =
                (publishDateRaw instanceof Date ? publishDateRaw.toISOString() : publishDateRaw)
                || (new Date(Date.now())).toISOString();

            if (publishEndDateCandidate <= publishDate) {
                // end date is earlier than publish date, error!
                throw new Error(ValidationReasons.MUST_BE_AFTER("publishDate"));
            }

            // Returning truthy value to indicate no error ocurred
            return true;
        })
        .toDate(),

    body("jobMinDuration", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT),

    body("jobMaxDuration", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT),

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
        .isArray({ min: FieldTypes.MIN_FIELDS, max: FieldTypes.MAX_FIELDS })
        .withMessage(ValidationReasons.ARRAY_SIZE(FieldTypes.MIN_FIELDS, FieldTypes.MAX_FIELDS))
        .bail()
        .custom(valuesInSet(FieldTypes.FieldTypes)),

    body("technologies", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isArray({ min: TechnologyTypes.MIN_TECHNOLOGIES, max: TechnologyTypes.MAX_TECHNOLOGIES })
        .withMessage(ValidationReasons.ARRAY_SIZE(TechnologyTypes.MIN_TECHNOLOGIES, TechnologyTypes.MAX_TECHNOLOGIES))
        .bail()
        .custom(valuesInSet(TechnologyTypes.TechnologyTypes)),

    body("isHidden", ValidationReasons.DEFAULT)
        .optional()
        .isBoolean().withMessage(ValidationReasons.BOOLEAN),

    body("owner", ValidationReasons.DEFAULT)
        .custom(async (owner, { req }) => {

            // When it reaches this validation, the user is either company or god
            if (req?.user?.company) return true;

            if (!owner) throw new Error(ValidationReasons.REQUIRED);

            try {
                if (await Company.findById(owner) === null) throw new Error("Company not found");
            } catch (e) {
                throw new Error(`no-company-found-with-id-${owner}`);
            }

            // Returning truthy value to indicate no error ocurred
            return true;
        })
        .withMessage("no-company-found-with-id-"),

    body("location", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .trim(),

    // TODO: Figure out how to handle this field
    // We should probably only receive the array part and inject the type that PointSchema requires in a custom sanitizer
    body("coordinates", ValidationReasons.DEFAULT)
        .optional()
        .isArray(),
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
]);

module.exports = { create, get };
