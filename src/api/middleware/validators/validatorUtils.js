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
 * Returns a validator that checks whether all of the elements of an array belong to the provided set of values
 * @param {Array} set
 */
const stringOrValuesInSet = (set) => (val) => {

    const checkValid = (value, arr) => {
        if (!arr.includes(value)) {
            throw new Error(ValidationReasons.IN_ARRAY(set));
        }
    };

    if (typeof val === "string") {
        checkValid(val, set);
    } else {
        for (const item of val) {
            checkValid(item, set);
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


module.exports = {
    valuesInSet,
    stringOrValuesInSet,
    checkDuplicatedEmail,
};
