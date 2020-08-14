const { body, param } = require("express-validator");

const { useExpressValidators } = require("../errorHandler");
const ValidationReasons = require("./validationReasons");
const { checkDuplicatedEmail, stringOrValuesInSet } = require("./validatorUtils");
const CompanyApplicationConstants = require("../../../models/constants/CompanyApplication");
const CompanyConstants = require("../../../models/constants/Company");
const AccountConstants = require("../../../models/constants/Account");
const { applicationUniqueness, isApprovable, isRejectable } = require("../../../models/CompanyApplication");
const mongoose = require("mongoose");
const ApplicationStatus = require("../../../models/constants/ApplicationStatus");

const create = useExpressValidators([
    body("email", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isEmail().normalizeEmail().withMessage(ValidationReasons.EMAIL)
        .bail()
        .custom(checkDuplicatedEmail).bail()
        .custom(applicationUniqueness)
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

const approve = useExpressValidators([
    param("id", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage(ValidationReasons.OBJECT_ID).bail()
        .custom(isApprovable),
]);

const reject = useExpressValidators([
    param("id", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .custom(isRejectable),
    body("rejectReason", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: CompanyApplicationConstants.rejectReason.max_length })
        .withMessage(ValidationReasons.TOO_LONG(CompanyApplicationConstants.rejectReason.max_length))
        .isLength({ min: CompanyApplicationConstants.rejectReason.min_length })
        .withMessage(ValidationReasons.TOO_SHORT(CompanyApplicationConstants.rejectReason.min_length)),
]);

const search = useExpressValidators([
    body("filters.companyName", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING),
    body("filters.state", ValidationReasons.DEFAULT)
        .optional()
        .custom(stringOrValuesInSet(Object.keys(ApplicationStatus))),
    body("filters.submissionDate.from", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601().withMessage(ValidationReasons.DATE),
    body("filters.submissionDate.to", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601().withMessage(ValidationReasons.DATE),
]);

module.exports = {
    create,
    approve,
    reject,
    search,
};
