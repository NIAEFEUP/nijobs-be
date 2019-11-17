const ValidationReasons = Object.freeze({
    DEFAULT: "invalid",
    REQUIRED: "required",
    TOO_LONG: (len) => `max-length-exceeded:${len}`,
    TOO_SHORT: (len) => `below-min-length:${len}`,
    STRING: "must-be-string",
    DATE: "must-be-ISO8601-date",
});

module.exports = ValidationReasons;
