const { body } = require("express-validator");

const { useExpressValidators } = require("../errorHandler");
const Account = require("../../../models/Account");

const checkDuplicateUsername = async (username) => {
    const acc = await Account.findOne({ username }).exec();
    if (acc) {
        throw new Error("Username already exists");
    }
};

const register = useExpressValidators([
    body("username", "Invalid username")
        .exists().withMessage("Username is required").bail()
        .isString().withMessage("Username must be a String")
        .bail()
        .custom(checkDuplicateUsername)
        .trim(),

    body("password", "Invalid password")
        .exists().withMessage("Password is required").bail()
        .isString().withMessage("Password must be a String")
        .isLength({ min: 8 }).withMessage("Password must have at least 8 characters")
        .matches(/\d/).withMessage("Password must contain a number"),
]);

module.exports = { register };
