const { body } = require("express-validator");

const { useExpressValidators } = require("../errorHandler");
const Account = require("../../../models/Account");

const checkDuplicatedEmail = async (email) => {
    const acc = await Account.findOne({ email }).exec();
    if (acc) {
        throw new Error("Email already exists");
    }
};

const register = useExpressValidators([
    body("email", "Invalid email")
        .exists().withMessage("Email is required").bail()
        .isString().withMessage("Email must be a String")
        .isEmail().withMessage("Email must be valid")
        .bail()
        .custom(checkDuplicatedEmail)
        .trim(),

    body("password", "Invalid password")
        .exists().withMessage("Password is required").bail()
        .isString().withMessage("Password must be a String")
        .isLength({ min: 8 }).withMessage("Password must have at least 8 characters")
        .matches(/\d/).withMessage("Password must contain a number"),
]);

module.exports = { register };
