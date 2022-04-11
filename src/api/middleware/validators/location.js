import { query } from "express-validator";

import { useExpressValidators } from "../errorHandler.js";
import ValidationReasons from "./validationReasons.js";

import LocationConstants from "../../../models/constants/Location.js";

export const search = useExpressValidators([
    query("searchTerm", ValidationReasons.DEFAULT)
        .isString().withMessage(ValidationReasons.STRING).bail()
        .isLength({ min: 3 }).withMessage(ValidationReasons.LOCATION_SEARCH_TERM_MIN_LENGTH(LocationConstants.searchTerm.minLength)),

]);
