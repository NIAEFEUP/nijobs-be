const { param, query } = require("express-validator");
const { useExpressValidators } = require("../errorHandler");
const ValidationReasons = require("./validationReasons");
const mongoose = require("mongoose");

const MAX_LIMIT_RESULTS = 100;

const finish = useExpressValidators([
    param("id", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage(ValidationReasons.OBJECT_ID).bail(),
]);

const list = useExpressValidators([
    query("limit", ValidationReasons.DEFAULT)
        .optional()
        .isInt({ min: 1, max: MAX_LIMIT_RESULTS })
        .withMessage(ValidationReasons.MAX(MAX_LIMIT_RESULTS)),
    query("offset", ValidationReasons.DEFAULT)
        .optional()
        .isInt({ min: 0 })
        .withMessage(ValidationReasons.MIN(0)),
]);


module.exports = {
    finish,
    list,
    MAX_LIMIT_RESULTS
};
