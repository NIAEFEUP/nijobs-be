const ValidationReasons = require("./validationReasons");
const Account = require("../../../models/Account");

/**
 * Returns a validator that checks whether all of the elements of an array belong to the provided set of values
 * @param {Array} set
 */
const valuesInSet = (set) => (arr) => {
    for (const item of arr) {
        if (!set.includes(item)) {
            throw new Error(ValidationReasons.IN_ARRAY(set));
        }
    }

    return true;
};

/**
 * Throws an error if it already exists a account with the given email.
 * @param {String} email
 */
const checkDuplicatedEmail = async (email) => {
    const acc = await Account.findOne({ email }).exec();
    if (acc) {
        throw new Error(ValidationReasons.ALREADY_EXISTS("email"));
    }
};

/**
 * Sanitizes the input val to return an array. If val is an array, this is a no-op
 * Otherwise wraps val in an array
 *
 * This is especially helpful when you expect an array in a query param,
 * but a one-element array is given, therefore it is parsed as a string instead
 * @param {*} val
 */
const ensureArray = (val) => {
    if (Array.isArray(val)) return val;

    else return [val];
};

module.exports = {
    valuesInSet,
    checkDuplicatedEmail,
    ensureArray
};
