const { body, param, query } = require("express-validator");

const { useExpressValidators } = require("../errorHandler");
const ValidationReasons = require("./validationReasons");
const { checkDuplicatedEmail, valuesInSet, parseArrayJSON } = require("./validatorUtils");
const CompanyApplicationConstants = require("../../../models/constants/CompanyApplication");
const CompanyConstants = require("../../../models/constants/Company");
const AccountConstants = require("../../../models/constants/Account");
const { applicationUniqueness, CompanyApplicationProps } = require("../../../models/CompanyApplication");
const mongoose = require("mongoose");
const ApplicationStatus = require("../../../models/constants/ApplicationStatus");

const MAX_LIMIT_RESULTS = 100;

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
        .withMessage(ValidationReasons.OBJECT_ID).bail(),
]);

const reject = useExpressValidators([
    param("id", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail(),
    body("rejectReason", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ max: CompanyApplicationConstants.rejectReason.max_length })
        .withMessage(ValidationReasons.TOO_LONG(CompanyApplicationConstants.rejectReason.max_length))
        .isLength({ min: CompanyApplicationConstants.rejectReason.min_length })
        .withMessage(ValidationReasons.TOO_SHORT(CompanyApplicationConstants.rejectReason.min_length)),
]);

const sortByParamValidator = (val) => {

    const regex = /^(\w+(:(desc|asc))?)(,\w+(:(desc|asc))?)*$/;
    if (!regex.test(val)) {
        throw new Error(ValidationReasons.WRONG_FORMAT("field:(desc|asc)?[,field:(desc|asc)?]*"));
    }

    const fields = val.split(",").map((sortOption) => sortOption.split(":")[0]);

    for (const field of fields) {
        if (!Object.prototype.hasOwnProperty.call(CompanyApplicationProps, field)) {
            throw new Error(ValidationReasons.IN_ARRAY(Object.keys(CompanyApplicationProps), field));
        }
    }

    return true;
};

const parseSortByField = (val) => val.split(",");


const search = useExpressValidators([
    query("limit", ValidationReasons.DEFAULT)
        .optional()
        .isInt({ min: 1, max: MAX_LIMIT_RESULTS })
        .withMessage(ValidationReasons.MAX(MAX_LIMIT_RESULTS)),
    query("offset", ValidationReasons.DEFAULT)
        .optional()
        .isInt({ min: 0 })
        .withMessage(ValidationReasons.MIN(0)),
    query("companyName", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING),
    query("state", ValidationReasons.DEFAULT)
        .optional()
        .isJSON().withMessage(ValidationReasons.ARRAY).bail()
        .customSanitizer(parseArrayJSON)
        .custom(valuesInSet(Object.keys(ApplicationStatus))),
    query("submissionDateFrom", ValidationReasons.DEFAULT)
        .optional()
        .toDate()
        .isISO8601().withMessage(ValidationReasons.DATE),
    query("submissionDateTo", ValidationReasons.DEFAULT)
        .optional()
        .toDate()
        .isISO8601().withMessage(ValidationReasons.DATE),
    query("sortBy", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING)
        .custom(sortByParamValidator)
        .customSanitizer(parseSortByField),
]);

module.exports = {
    create,
    approve,
    reject,
    search,
    MAX_LIMIT_RESULTS,
};
