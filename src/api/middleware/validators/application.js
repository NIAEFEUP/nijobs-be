import { body, param, query } from "express-validator";
import mongoose from "mongoose";

import { useExpressValidators } from "../errorHandler.js";
import ValidationReasons from "./validationReasons.js";
import { checkDuplicatedEmail, valuesInSet, ensureArray } from "./validatorUtils.js";
import CompanyApplicationConstants from "../../../models/constants/CompanyApplication.js";
import CompanyConstants from "../../../models/constants/Company.js";
import { applicationUniqueness, CompanyApplicationProps } from "../../../models/CompanyApplication.js";
import ApplicationStatus from "../../../models/constants/ApplicationStatus.js";
import { password } from "./auth.js";

export const MAX_LIMIT_RESULTS = 100;

export const create = useExpressValidators([
    body("email", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isEmail().withMessage(ValidationReasons.EMAIL)
        .bail()
        .custom(checkDuplicatedEmail).bail()
        .custom(applicationUniqueness)
        .trim(),
    password,

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

export const approve = useExpressValidators([
    param("id", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage(ValidationReasons.OBJECT_ID).bail(),
]);

export const reject = useExpressValidators([
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

const isAfterSubmissionDateFrom = (submissionDateTo, { req }) => {

    const { submissionDateFrom } = req.query;

    console.info(req.body);
    console.info("Dates:", `\n\tFrom: ${submissionDateFrom};\n\tTo: ${submissionDateTo};`);

    return submissionDateFrom <= submissionDateTo;
};

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


export const search = useExpressValidators([
    query("limit", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT).bail()
        .toInt()
        /*
        Split validation checks in order to provide better error messages.
        Another solution would be to return a "compound" error message, aka, one that contains both pieces of information.
        The latter could help keep validation chains smaller.
        */
        .isInt({ min: 1 }).withMessage(ValidationReasons.MIN(1)).bail()
        .isInt({ max: MAX_LIMIT_RESULTS }).withMessage(ValidationReasons.MAX(MAX_LIMIT_RESULTS)).bail()
        .toInt(),
    query("offset", ValidationReasons.DEFAULT)
        .optional()
        .isInt().withMessage(ValidationReasons.INT).bail()
        .toInt()
        .isInt({ min: 0 }).withMessage(ValidationReasons.MIN(0)).bail()
        .toInt(),
    query("companyName", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING).bail(),
    query("state", ValidationReasons.DEFAULT)
        .optional()
        .isArray().withMessage(ValidationReasons.ARRAY).bail()
        .customSanitizer(ensureArray)
        .custom(valuesInSet(Object.keys(ApplicationStatus))),
    query("submissionDateFrom", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601().withMessage(ValidationReasons.DATE).bail()
        .toDate(),
    query("submissionDateTo", ValidationReasons.DEFAULT)
        .optional()
        .isISO8601().withMessage(ValidationReasons.DATE).bail()
        .toDate()
        .if((_, { req }) => req.query.submissionDateFrom !== undefined)
        .custom(isAfterSubmissionDateFrom).withMessage(ValidationReasons.MUST_BE_AFTER("submissionDateFrom")),
    query("sortBy", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING).bail()
        .custom(sortByParamValidator)
        .customSanitizer(parseSortByField),
]);
