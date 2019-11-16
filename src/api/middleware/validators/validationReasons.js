const ValidationReasons = Object.freeze({
    DEFAULT: "invalid",
    REQUIRED: "required",
    TOO_LONG: (len) => `max-length-exceeded:${len}`,
    TOO_SHORT: (len) => `below-min-length:${len}`,
    STRING: "must-be-string",
});

module.exports = ValidationReasons;
