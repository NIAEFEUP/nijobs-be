const { body } = require("express-validator");

const { useExpressValidators } = require("../errorHandler");
const ValidationReasons = require("./validationReasons");
const { checkDuplicatedEmail } = require("./validatorUtils");

const create = useExpressValidators([
    body("email", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .normalizeEmail().isEmail().withMessage(ValidationReasons.EMAIL)
        .bail()
        .custom(checkDuplicatedEmail)
        .trim(),

    body("password", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ min: 8 }).withMessage(ValidationReasons.TOO_SHORT(8))
        .matches(/\d/).withMessage(ValidationReasons.HAVE_NUMBER),

    body("motivation", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: 1500 }).withMessage(ValidationReasons.TOO_LONG(1500))
        .isLength({ min: 10 }).withMessage(ValidationReasons.TOO_SHORT(10))
        .trim(),

    body("companyName", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: 20 }).withMessage(ValidationReasons.TOO_LONG(20))
        .isLength({ min: 3 }).withMessage(ValidationReasons.TOO_SHORT(3))
        .trim(),
]);


module.exports = { create };
