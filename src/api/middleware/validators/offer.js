const { body, query } = require("express-validator");

const { useExpressValidators } = require("../errorHandler");
const ValidationReasons = require("./validationReasons");
const { valuesInSet } = require("./validatorUtils");
const JobTypes = require("../../../models/JobTypes");
const FieldTypes = require("../../../models/FieldTypes");
const TechnologyTypes = require("../../../models/TechnologyTypes");
const OfferService = require("../../../services/offer");

const create = useExpressValidators([
    body("title", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: 90 }).withMessage(ValidationReasons.TOO_LONG(90))
        .trim(),

    body("publishDate", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE)
        .toDate(),

    body("publishEndDate", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .isAfter().withMessage(ValidationReasons.DATE_EXPIRED)
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
        .isLength({ max: 1500 }).withMessage(ValidationReasons.TOO_LONG(1500))
        .trim(),

    body("contacts", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail(),

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

    // TODO: Add validation for the owner being a Mongo ObjectId that is correctly referencing an existing Company
    body("owner", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail(),

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
]);

module.exports = { create, get };
