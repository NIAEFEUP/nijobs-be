const { body } = require("express-validator");

const { useExpressValidators } = require("../errorHandler");
const ValidationReasons = require("./validationReasons");
const { checkDuplicatedEmail } = require("./validatorUtils");
const CompanyApplicationConstants = require("../../../models/constants/CompanyApplication");
const CompanyConstants = require("../../../models/constants/Company");
const AccountConstants = require("../../../models/constants/Account");

const create = useExpressValidators([
    body("email", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isEmail().normalizeEmail().withMessage(ValidationReasons.EMAIL)
        .bail()
        .custom(checkDuplicatedEmail)
        .trim(),

    body("password", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ min: AccountConstants.password.min_length })
        .withMessage(ValidationReasons.TOO_SHORT(AccountConstants.password.min_length))
        .matches(/\d/).withMessage(ValidationReasons.HAS_NUMBER),

    body("motivation", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: CompanyApplicationConstants.motivation.max_length })
        .withMessage(ValidationReasons.TOO_LONG(CompanyApplicationConstants.motivation.max_length))
        .isLength({ min: CompanyApplicationConstants.motivation.min_length })
        .withMessage(ValidationReasons.TOO_SHORT(CompanyApplicationConstants.motivation.min_length))
        .trim(),

    body("companyName", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: CompanyConstants.companyName.max_length })
        .withMessage(ValidationReasons.TOO_LONG(CompanyConstants.companyName.max_length))
        .isLength({ min: CompanyConstants.companyName.min_length })
        .withMessage(ValidationReasons.TOO_SHORT(CompanyConstants.companyName.min_length))
        .trim(),
]);


module.exports = { create };
