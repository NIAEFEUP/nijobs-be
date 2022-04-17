import { body, param } from "express-validator";

import { useExpressValidators } from "../errorHandler.js";
import ValidationReasons from "./validationReasons.js";
import { checkDuplicatedEmail } from "./validatorUtils.js";
import AccountConstants from "../../../models/constants/Account.js";

export const register = useExpressValidators([
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
]);

export const login =  useExpressValidators([
    body("email", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .normalizeEmail().isEmail().withMessage(ValidationReasons.EMAIL)
        .trim(),

    body("password", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING),
]);

export const recover =  useExpressValidators([
    body("email", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .normalizeEmail().isEmail().withMessage(ValidationReasons.EMAIL)
        .trim(),
]);

export const confirmRecover =  useExpressValidators([
    param("token", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .trim(),
]);

export const finishRecover =  useExpressValidators([
    param("token", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .trim(),
    body("password", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .isString().withMessage(ValidationReasons.STRING)
        .isLength({ min: AccountConstants.password.min_length })
        .withMessage(ValidationReasons.TOO_SHORT(AccountConstants.password.min_length))
        .matches(/\d/).withMessage(ValidationReasons.HAS_NUMBER),
]);
