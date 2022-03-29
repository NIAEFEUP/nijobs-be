import { query } from "express-validator";

import { useExpressValidators } from "../errorHandler.js";
import ValidationReasons from "./validationReasons.js";


export const search = useExpressValidators([
    query("city", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING),

    query("country", ValidationReasons.DEFAULT)
        .optional()
        .isString().withMessage(ValidationReasons.STRING),

    query("longitude", ValidationReasons.DEFAULT)
        .optional()
        .isNumeric().withMessage(ValidationReasons.NUMERIC),

    query("latitude", ValidationReasons.DEFAULT)
        .optional()
        .isNumeric().withMessage(ValidationReasons.NUMERIC),
]);
