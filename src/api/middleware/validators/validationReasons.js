const ValidationReasons = Object.freeze({
    DEFAULT: "invalid",
    REQUIRED: "required",
    MIN: (val) => `must-be-greater-than-${val}`,
    MAX: (val) => `must-be-lower-than-${val}`,
    TOO_LONG: (len) => `max-length-exceeded:${len}`,
    TOO_SHORT: (len) => `below-min-length:${len}`,
    STRING: "must-be-string",
    ARRAY: "must-be-array",
    DATE: "must-be-ISO8601-date",
    INT: "must-be-int",
    BOOLEAN: "must-be-boolean",
    IN_ARRAY: (vals, field) => `${field ? `${field}:` : ""}must-be-in:[${vals}]`,
    ARRAY_SIZE: (min, max) => `size-must-be-between:[${min},${max}]`,
    OBJECT_ID: "must-be-a-valid-id",
    EMAIL: "must-be-a-valid-email",
    HAS_NUMBER: "must-contain-number",
    ALREADY_EXISTS: (variable) => `${variable}-already-exists`,
    DATE_EXPIRED: "date-already-past",
    MUST_BE_AFTER: (variable) => `must-be-after:${variable}`,
    MUST_BE_BEFORE: (variable) => `must-be-before:${variable}`,
    WRONG_FORMAT: (format) => `must-be-format-${format}`,
    COMPANY_NOT_FOUND: (id) => `no-company-found-with-id:${id}`,
<<<<<<< HEAD
    MAX_CONCURRENT_OFFERS_EXCEEDED: (max) => `max-concurrent-offers-reached:${max}`,
=======
    OFFER_NOT_FOUND: (id) => `no-offer-found-with-id:${id}`,
    NOT_OFFER_OWNER: (id) => `not-offer-owner:${id}`,
>>>>>>> Add some validators to edit and validationReasons
});

module.exports = ValidationReasons;
