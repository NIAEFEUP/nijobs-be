import { body, query, param } from "express-validator";
import { useExpressValidators } from "../errorHandler.js";
import ValidationReasons from "./validationReasons.js";
import CompanyConstants from "../../../models/constants/Company.js";
import { ensureArray, isObjectId, normalizeDate } from "./validatorUtils.js";
import CompanyService from "../../../services/company.js";
import { MONTH_IN_MS, OFFER_MAX_LIFETIME_MONTHS } from "../../../models/constants/TimeConstants.js";

export const MAX_LIMIT_RESULTS = 100;
const DEFAULT_PUBLISH_DATE = new Date(Date.now()).toISOString();

export const finish = useExpressValidators([
    body("bio", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: CompanyConstants.bio.max_length })
        .withMessage(ValidationReasons.TOO_LONG(CompanyConstants.bio.max_length)),
    body("contacts", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .customSanitizer(ensureArray)
        .isArray({ min: CompanyConstants.contacts.min_length, max: CompanyConstants.contacts.max_length })
        .withMessage(ValidationReasons.ARRAY_SIZE(CompanyConstants.contacts.min_length, CompanyConstants.contacts.max_length))
]);

export const list = useExpressValidators([
    query("limit", ValidationReasons.DEFAULT)
        .optional()
        .isInt({ min: 1, max: MAX_LIMIT_RESULTS })
        .withMessage(ValidationReasons.MAX(MAX_LIMIT_RESULTS)),
    query("offset", ValidationReasons.DEFAULT)
        .optional()
        .isInt({ min: 0 })
        .withMessage(ValidationReasons.MIN(0)),
]);

export const companyExists = async (companyId) => {
    try {
        const company = await new CompanyService().findById(companyId, true);
        if (!company) throw new Error(ValidationReasons.COMPANY_NOT_FOUND(companyId));
    } catch (err) {
        console.error(err);
        throw err;
    }

    return true;
};

const publishEndDateAfterPublishDate = (publishEndDateCandidate, { req }) => {
    const publishDate = req.body?.publishDate || DEFAULT_PUBLISH_DATE;
    return publishEndDateCandidate > publishDate;
};

const existingCompanyParamValidator = param("companyId")
    .exists().withMessage(ValidationReasons.REQUIRED).bail()
    .custom(isObjectId).withMessage(ValidationReasons.OBJECT_ID).bail()
    .custom(companyExists).withMessage(ValidationReasons.COMPANY_NOT_FOUND);

export const block = useExpressValidators([
    existingCompanyParamValidator,
    body("adminReason")
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING).bail()
        .trim(),
]);

export const disable = useExpressValidators([
    existingCompanyParamValidator,
]);

export const enable = useExpressValidators([
    existingCompanyParamValidator,
]);

export const deleteCompany = useExpressValidators([
    existingCompanyParamValidator,
]);

export const getOffers = useExpressValidators([
    existingCompanyParamValidator,
]);

export const checkConcurrent = useExpressValidators([
    existingCompanyParamValidator,

    body("publishDate", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .customSanitizer(normalizeDate),

    body("publishEndDate", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE).bail()
        .customSanitizer(normalizeDate)
        .custom(publishEndDateAfterPublishDate)
        .withMessage(ValidationReasons.MUST_BE_AFTER("publishDate")),
]);

export const setDefaultValuesConcurrent = (req, res, next) => {
    if (!req.body?.publishDate) req.body.publishDate = DEFAULT_PUBLISH_DATE;

    if (!req.body?.publishEndDate) {
        const publishDateMS = Date.parse(req.body.publishDate);
        const offerMaxTimeMS = OFFER_MAX_LIFETIME_MONTHS * MONTH_IN_MS;
        req.body.publishEndDate = (new Date(publishDateMS + offerMaxTimeMS)).toISOString();
    }
    return next();
};
