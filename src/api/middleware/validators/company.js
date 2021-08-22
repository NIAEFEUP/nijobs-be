const { body, query, param } = require("express-validator");
const { useExpressValidators } = require("../errorHandler");
const ValidationReasons = require("./validationReasons");
const CompanyConstants = require("../../../models/constants/Company");
const { ensureArray } = require("./validatorUtils");
const { isObjectId } = require("./validatorUtils");
const CompanyService = require("../../../services/company");

const MAX_LIMIT_RESULTS = 100;

const finish = useExpressValidators([
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

const list = useExpressValidators([
    query("limit", ValidationReasons.DEFAULT)
        .optional()
        .isInt({ min: 1, max: MAX_LIMIT_RESULTS })
        .withMessage(ValidationReasons.MAX(MAX_LIMIT_RESULTS)),
    query("offset", ValidationReasons.DEFAULT)
        .optional()
        .isInt({ min: 0 })
        .withMessage(ValidationReasons.MIN(0)),
]);

const companyExists = async (companyId) => {
    try {
        const company = await new CompanyService().findById(companyId, true);
        if (!company) throw new Error(ValidationReasons.COMPANY_NOT_FOUND(companyId));
    } catch (err) {
        console.error(err);
        throw err;
    }

    return true;
};

const existingCompanyParamValidator = param("companyId")
    .exists().withMessage(ValidationReasons.REQUIRED).bail()
    .custom(isObjectId).withMessage(ValidationReasons.OBJECT_ID).bail()
    .custom(companyExists).withMessage(ValidationReasons.COMPANY_NOT_FOUND);

const block = useExpressValidators([
    existingCompanyParamValidator,
    body("adminReason")
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING).bail()
        .trim(),
]);

const disable = useExpressValidators([
    existingCompanyParamValidator,
]);

const enable = useExpressValidators([
    existingCompanyParamValidator,
]);

const deleteCompany = useExpressValidators([
    existingCompanyParamValidator,
]);

/**
 * Checks if the param companyId is valid and corresponds to a valid company
 */
const getOffers = useExpressValidators([
    param("companyId", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .custom(isObjectId).withMessage(ValidationReasons.OBJECT_ID).bail()
        .custom(companyExists).withMessage(ValidationReasons.COMPANY_NOT_FOUND)
]);

module.exports = {
    finish,
    list,
    block,
    enable,
    disable,
    deleteCompany,
    companyExists,
    getOffers,
    MAX_LIMIT_RESULTS,
};
