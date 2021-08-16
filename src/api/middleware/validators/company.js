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

const block = useExpressValidators([
    param("companyId")
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .custom(isObjectId).withMessage(ValidationReasons.OBJECT_ID).bail()
        .custom(companyExists).withMessage(ValidationReasons.COMPANY_NOT_FOUND),
    body("adminReason")
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING).bail()
        .trim(),
]);

const disable = useExpressValidators([
    param("companyId")
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .custom(isObjectId).withMessage(ValidationReasons.OBJECT_ID).bail()
        .custom(companyExists).withMessage(ValidationReasons.COMPANY_NOT_FOUND),
]);

const enable = useExpressValidators([
    param("companyId")
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .custom(isObjectId).withMessage(ValidationReasons.OBJECT_ID).bail()
        .custom(companyExists).withMessage(ValidationReasons.COMPANY_NOT_FOUND),
]);

const validCompanyId = useExpressValidators([
    param("companyId", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED)
        .custom(isObjectId).withMessage(ValidationReasons.OBJECT_ID),
]);

const isExistingCompany = useExpressValidators([
    param("companyId", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .custom(isObjectId).withMessage(ValidationReasons.OBJECT_ID).bail()
        .custom(async (companyId, { req }) => {
            try {
                // including blocked companies (2nd argument)
                const company = await (new CompanyService()).findById(companyId, true, req.hasAdminPrivileges);
                if (!company) throw new Error(ValidationReasons.COMPANY_NOT_FOUND(companyId));
            } catch (err) {
                console.error(err);
                throw err;
            }
            return true;
        })
]);

module.exports = {
    finish,
    list,
    block,
    enable,
    disable,
    companyExists,
    validCompanyId,
    isExistingCompany,
    MAX_LIMIT_RESULTS,
};
