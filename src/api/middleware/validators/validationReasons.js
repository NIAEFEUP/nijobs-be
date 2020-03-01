const ValidationReasons = Object.freeze({
    DEFAULT: "invalid",
    REQUIRED: "required",
    TOO_LONG: (len) => `max-length-exceeded:${len}`,
    TOO_SHORT: (len) => `below-min-length:${len}`,
    STRING: "must-be-string",
    DATE: "must-be-ISO8601-date",
    INT: "must-be-int",
    BOOLEAN: "must-be-boolean",
    IN_ARRAY: (vals) => `must-be-in:[${vals}]`,
    ARRAY_SIZE: (min, max) => `size-must-be-between:[${min},${max}]`,
    EMAIL: "must-be-a-valid-email",
    HAS_NUMBER: "must-contain-number",
    ALREADY_EXISTS: (variable) => `${variable}-already-exists`,
    DATE_EXPIRED: "date-already-past",
    MUST_BE_AFTER: (variable) => `must-be-after:${variable}`,
    OFFER_LIMIT_REACHED: (variable) => `The company ${variable} has already reached the allowed amount of active offers.`,
});

module.exports = ValidationReasons;
