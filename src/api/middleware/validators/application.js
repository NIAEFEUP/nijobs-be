const { body } = require("express-validator");

const { useExpressValidators } = require("../errorHandler");
const ValidationReasons = require("./validationReasons");
const { checkDuplicatedEmail } = require("./validatorUtils");
const companyApplicationConstants = require("../../../models/constants/CompanyApplication");
const companyConstants = require("../../../models/constants/Company");
const accountConstants = require("../../../models/constants/Account");

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
        .isLength({ min: accountConstants.password.min_length })
        .withMessage(ValidationReasons.TOO_SHORT(accountConstants.password.min_length))
        .matches(/\d/).withMessage(ValidationReasons.HAS_NUMBER),

    body("motivation", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: companyApplicationConstants.motivation.max_length })
        .withMessage(ValidationReasons.TOO_LONG(companyApplicationConstants.motivation.max_length))
        .isLength({ min: companyApplicationConstants.motivation.min_length })
        .withMessage(ValidationReasons.TOO_SHORT(companyApplicationConstants.motivation.min_length))
        .trim(),

    body("companyName", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: companyConstants.companyName.max_length })
        .withMessage(ValidationReasons.TOO_LONG(companyConstants.companyName.max_length))
        .isLength({ min: companyConstants.companyName.min_length })
        .withMessage(ValidationReasons.TOO_SHORT(companyConstants.companyName.min_length))
        .trim(),
]);


module.exports = { create };
