import { query } from "express-validator";

import { useExpressValidators } from "../errorHandler.js";
import ValidationReasons from "./validationReasons.js";

const mustHaveLongitude = (latitude, { req }) => {

    const { longitude } = req.query;

    return !!longitude;
};

const mustHaveLatitude = (longitude, { req }) => {

    const { latitude } = req.query;

    return !!latitude;
};

export const search = useExpressValidators([
    query("city", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING),

    query("country", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING),

    query("longitude", ValidationReasons.DEFAULT)
        .optional()
        .isNumeric().withMessage(ValidationReasons.NUMERIC).bail()
        .custom(mustHaveLatitude).withMessage(ValidationReasons.MUST_HAVE_BOTH_COORDINATES).bail(),

    query("latitude", ValidationReasons.DEFAULT)
        .optional()
        .isNumeric().withMessage(ValidationReasons.NUMERIC).bail()
        .custom(mustHaveLongitude).withMessage(ValidationReasons.MUST_HAVE_BOTH_COORDINATES).bail(),
]);
