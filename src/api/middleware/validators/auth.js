const { body } = require("express-validator");

const { useExpressValidators } = require("../errorHandler");
const ValidationReasons = require("./validationReasons");
const { checkDuplicatedEmail } = require("./validatorUtils");
const accountConstants = require("../../../models/constants/Account");

const register = useExpressValidators([
    body("email", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .normalizeEmail().isEmail().withMessage(ValidationReasons.EMAIL)
        .bail()
        .custom(checkDuplicatedEmail)
        .trim(),

    body("password", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ min: accountConstants.password.min_length }).withMessage(ValidationReasons.TOO_SHORT(8))
        .matches(/\d/).withMessage(ValidationReasons.HAS_NUMBER),
]);

const login =  useExpressValidators([
    body("email", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .normalizeEmail().isEmail().withMessage(ValidationReasons.EMAIL)
        .trim(),

    body("password", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING),
]);

module.exports = { register, login };
