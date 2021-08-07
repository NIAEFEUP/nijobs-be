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

const validImageURL = (val) => {
    // eslint-disable-next-line max-len
    const regex = /^(?:https?:\/\/)(?:(?:localhost:\d{1,5}\/(?:[^/#?\s[",><]+[/.])+[^/#?\s[",><]*)|(?:(?:[a-z0-9-]+\.)+[a-z]{2,6}(?:\/[^/#?\s[",><]+)+\/?))(?:\?[^\s[",><]+)?$/;

    return regex.test(val);
};

module.exports = {
    hasDuplicates,
    lengthBetween,

    noDuplicatesValidator,
    lengthBetweenValidator,
    validImageURL,
};
