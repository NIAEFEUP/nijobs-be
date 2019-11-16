const { body } = require("express-validator");

const { useExpressValidators } = require("../errorHandler");
// const Offer = require("../../../models/Offer");

// const checkDuplicateUsername = async (username) => {
//     const acc = await Account.findOne({ username }).exec();
//     if (acc) {
//         throw new Error("Username already exists");
//     }
// };

const create = useExpressValidators([
    body("title", "Invalid title")
        .exists().withMessage("title is required").bail()
        .isString().withMessage("title must be a String")
        .isLength({ max: 90 }).withMessage("title must not be longer than 90 characters")
        .trim(),

    body("publishDate", "Invalid publishDate")
        .exists().withMessage("publishDate is required").bail(),

    body("endDate", "Invalid endDate")
        .exists().withMessage("endDate is required").bail(),

    body("description", "Invalid description")
        .exists().withMessage("description is required").bail()
        .isString()
        .isLength({ max: 1500 })
        .trim(),

    body("contacts", "Invalid contacts")
        .exists().withMessage("contacts is required").bail(),

    body("jobType", "Invalid jobType")
        .exists().withMessage("jobType is required").bail(),

    body("technologies", "Invalid technologies")
        .exists().withMessage("technologies is required").bail(),

    body("owner", "Invalid owner")
        .exists().withMessage("owner is required").bail(),

    body("location", "Invalid location")
        .exists().withMessage("location is required").bail(),
]);

module.exports = { create };
