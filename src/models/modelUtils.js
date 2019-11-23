const hasDuplicates = (arr) => new Set(arr).size !== arr.length;

const noDuplicatesValidator = (val) => {
    if (hasDuplicates(val)) {
        throw new Error("Duplicate values in array `{PATH}`: [{VALUE}]");
    }

    return true;
};

const lengthBetween = (arr, min, max) => arr.length >= min && arr.length <= max;

const lengthBetweenValidator = (val, min, max) => {
    if (!lengthBetween(val, min, max)) {
        throw new Error(`\`{PATH}\` must have length between ${min} and ${max}`);
    }

    return true;
};

module.exports = {
    hasDuplicates,
    lengthBetween,

    noDuplicatesValidator,
    lengthBetweenValidator,
};
