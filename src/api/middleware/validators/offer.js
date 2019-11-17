const { body } = require("express-validator");

const { useExpressValidators } = require("../errorHandler");
const ValidationReasons = require("./validationReasons");

// const Offer = require("../../../models/Offer");

// const checkDuplicateUsername = async (username) => {
//     const acc = await Account.findOne({ username }).exec();
//     if (acc) {
//         throw new Error("Username already exists");
//     }
// };

const create = useExpressValidators([
    body("title", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: 90 }).withMessage(ValidationReasons.TOO_LONG(90))
        .trim(),

    body("publishDate", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE),

    body("endDate", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isISO8601({ strict: true }).withMessage(ValidationReasons.DATE),

    body("description", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: 1500 }).withMessage(ValidationReasons.TOO_LONG(1500))
        .trim(),

    body("contacts", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail(),

    body("jobType", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail(),

    body("technologies", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail(),

    body("owner", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail(),

    body("location", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail(),
]);

module.exports = { create };
