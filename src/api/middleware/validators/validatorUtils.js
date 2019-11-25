const ValidationReasons = require("./validationReasons");

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

module.exports = {
    valuesInSet,
};
