const HTTPStatus = require("http-status-codes");
const { ErrorTypes } = require("../../src/api/middleware/errorHandler");
const ValidationReasons = require("../../src/api/middleware/validators/validationReasons");
const { DAY_TO_MS } = require("../utils/TimeConstants");

/**
 * `requestEndpoint` is a method that receives params and calls the appropriate endpoint with the params if they exist/are appropriate.
 * Returns a promise (request() return value)
 *
 * `field_name` is the name of the field to validate input for
 * @param {Function} requestEndpoint
 */
const ValidatorTester = (requestEndpoint) => (location) => (field_name) => ({
    isRequired: () => {
        test("should be required", async () => {
            const params = {};
            const res = await requestEndpoint(params);

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.REQUIRED,
                "param": field_name,
            });
        });
    },

    mustBeString: () => {
        test("should be a String", async () => {
            const params = {
                [field_name]: 123,
            };
            const res = await requestEndpoint(params);

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.STRING,
                "param": field_name,
                "value": params[field_name],
            });
        });
    },

    mustBeDate: () => {
        test("should be a Date", async () => {
            const params = {
                [field_name]: 123,
            };
            const res = await requestEndpoint(params);

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.DATE,
                "param": field_name,
                "value": params[field_name],
            });
        });
    },

    mustBeFuture: () => {
        test("should be a future Date", async () => {
            const params = {
                [field_name]: "1998-12-25",
            };
            const res = await requestEndpoint(params);

            expect(res.status).toBe(422);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.DATE_EXPIRED,
                "param": field_name,
                "value": params[field_name],
            });
        });
    },

    mustBeAfter: (field_name2) => {
        test(`should be after ${field_name2}`, async () => {
            const params = {
                [field_name]: new Date(Date.now()).toISOString(),
                [field_name2]: new Date(Date.now() + (DAY_TO_MS)).toISOString(),
            };

            const res = await requestEndpoint(params);

            expect(res.status).toBe(422);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.MUST_BE_AFTER(field_name2),
                "param": field_name,
                "value": params[field_name],
            });
        });
    },

    mustBeNumber: () => {
        test("should be a Number", async () => {
            const params = {
                [field_name]: "string_content",
            };
            const res = await requestEndpoint(params);

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.INT,
                "param": field_name,
                "value": params[field_name],
            });
        });
    },

    mustBeBoolean: () => {
        test("should be a Boolean", async () => {
            const params = {
                [field_name]: 123,
            };
            const res = await requestEndpoint(params);

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.BOOLEAN,
                "param": field_name,
                "value": params[field_name],
            });
        });
    },

    mustBeInArray: (array) => {
        test(`should be one of: [${array}]`, async () => {
            const params = {
                [field_name]: "not_in_array",
            };
            const res = await requestEndpoint(params);

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.IN_ARRAY(array),
                "param": field_name,
                "value": params[field_name],
            });
        });
    },

    mustHaveValuesInRange: (array, n_elems) => {
        test(`should be one of: [${array}]`, async () => {
            const param_values = [];
            for (let i = 0; i < n_elems; ++i) {
                param_values.push(`${array[0]}-not_in_range`);
            }
            const params = {
                [field_name]: param_values,
            };
            const res = await requestEndpoint(params);

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.IN_ARRAY(array),
                "param": field_name,
                "value": params[field_name],
            });
        });
    },

    mustBeArrayBetween: (arr_min, arr_max) => {
        test(`should be Array with size between ${arr_min} and ${arr_max}`, async () => {
            const params = {
                [field_name]: Array.from("a".repeat(arr_max + 1)),
            };
            const res = await requestEndpoint(params);

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.ARRAY_SIZE(arr_min, arr_max),
                "param": field_name,
                "value": params[field_name],
            });
        });
    },

    hasMaxLength: (max_length) => {
        test(`should not be longer than ${max_length} characters`, async () => {
            const params = {
                [field_name]: "a".repeat(max_length + 1),
            };

            const res = await requestEndpoint(params);

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.TOO_LONG(max_length),
                "param": field_name,
                "value": params[field_name],
            });
        });
    },

    hasMinLength: (min_length) => {
        test(`should not be smaller than ${min_length} characters`, async () => {
            const params = {
                [field_name]: "a".repeat(min_length - 1),
            };

            const res = await requestEndpoint(params);

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.TOO_SHORT(min_length),
                "param": field_name,
                "value": params[field_name],
            });
        });
    },


    mustBeEmail: () => {
        test("should be a valid email", async () => {
            const params = {
                [field_name]: "@aaa",
            };

            const res = await requestEndpoint(params);

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.EMAIL,
                "param": field_name,
                "value": params[field_name],
            });
        });
    },

    hasNumber: () => {
        test("should have a number", async () => {
            const params = {
                [field_name]: "aaa",
            };

            const res = await requestEndpoint(params);

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": location,
                "msg": ValidationReasons.HAVE_NUMBER,
                "param": field_name,
                "value": params[field_name],
            });
        });
    },
});

module.exports = ValidatorTester;
