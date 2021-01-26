const { param } = require("express-validator");
const { useExpressValidators } = require("../errorHandler");
const ValidationReasons = require("./validationReasons");
const mongoose = require("mongoose");

const finish = useExpressValidators([
    param("id", ValidationReasons.DEFAULT)
        .exists().withMessage(ValidationReasons.REQUIRED).bail()
        .custom((value) => mongoose.Types.ObjectId.isValid(value))
        .withMessage(ValidationReasons.OBJECT_ID).bail(),
]);


module.exports = {
    finish
};
