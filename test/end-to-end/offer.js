const Offer = require("../../src/models/Offer");
const JobTypes = require("../../src/models/JobTypes");
const FieldTypes = require("../../src/models/FieldTypes");
const TechnologyTypes = require("../../src/models/TechnologyTypes");
const { ErrorTypes } = require("../../src/api/middleware/errorHandler");
const ValidationReasons = require("../../src/api/middleware/validators/validationReasons");

// ------- Test helper functions for generating test code --------
// TODO: Generalize these even more for usage in other tests
// (pass endpoint as argument, maybe as function returning function for usage in the whole test suite for an endpoint)
const fieldIsRequired = (field_name) => {
    describe(field_name, () => {
        test("should be required", async () => {
            const params = {};
            const res = await request()
                .post("/offer")
                .send(withAdminToken(params));

            expect(res.status).toBe(422);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": "body",
                "msg": ValidationReasons.REQUIRED,
                "param": field_name,
            });
        });
    });
};

const fieldMustBeString = (field_name) => {
    test("should be a String", async () => {
        const params = {
            [field_name]: 123,
        };
        const res = await request()
            .post("/offer")
            .send(withAdminToken(params));

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors).toContainEqual({
            "location": "body",
            "msg": ValidationReasons.STRING,
            "param": field_name,
            "value": params[field_name],
        });
    });
};

const fieldMustBeDate = (field_name) => {
    test("should be a Date", async () => {
        const params = {
            [field_name]: 123,
        };
        const res = await request()
            .post("/offer")
            .send(withAdminToken(params));

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors).toContainEqual({
            "location": "body",
            "msg": ValidationReasons.DATE,
            "param": field_name,
            "value": params[field_name],
        });
    });
};

const fieldMustBeNumber = (field_name) => {
    test("should be a Number", async () => {
        const params = {
            [field_name]: "string_content",
        };
        const res = await request()
            .post("/offer")
            .send(withAdminToken(params));

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors).toContainEqual({
            "location": "body",
            "msg": ValidationReasons.INT,
            "param": field_name,
            "value": params[field_name],
        });
    });
};

const fieldMustBeBoolean = (field_name) => {
    test("should be a Boolean", async () => {
        const params = {
            [field_name]: 123,
        };
        const res = await request()
            .post("/offer")
            .send(withAdminToken(params));

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors).toContainEqual({
            "location": "body",
            "msg": ValidationReasons.BOOLEAN,
            "param": field_name,
            "value": params[field_name],
        });
    });
};

const fieldMustBeInArray = (field_name, array) => {
    test(`should be one of: [${array}]`, async () => {
        const params = {
            [field_name]: "not_in_array",
        };
        const res = await request()
            .post("/offer")
            .send(withAdminToken(params));

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors).toContainEqual({
            "location": "body",
            "msg": ValidationReasons.IN_ARRAY(array),
            "param": field_name,
            "value": params[field_name],
        });
    });
};

const fieldMustBeArrayBetween = (field_name, arr_min, arr_max) => {
    test(`should be Array with size between ${arr_min} and ${arr_max}`, async () => {
        const params = {
            [field_name]: Array.from("a".repeat(arr_max + 1)),
        };
        const res = await request()
            .post("/offer")
            .send(withAdminToken(params));

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors).toContainEqual({
            "location": "body",
            "msg": ValidationReasons.ARRAY_SIZE(arr_min, arr_max),
            "param": field_name,
            "value": params[field_name],
        });
    });
};

const fieldHasMaxLength = (field_name, max_length) => {
    test(`should not be longer than ${max_length} characters`, async () => {
        const params = {
            [field_name]: "a".repeat(max_length + 1),
        };

        const res = await request()
            .post("/offer")
            .send(withAdminToken(params));

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors).toContainEqual({
            "location": "body",
            "msg": ValidationReasons.TOO_LONG(max_length),
            "param": field_name,
            "value": params[field_name],
        });
    });
};

const withAdminToken = (params) => ({ ...params, admin_token: "testing_is_cool73" });
//----------------------------------------------------------------

describe("Offer endpoint tests", () => {
    describe("Authentication", () => {
        describe("creating offers requires admin permissions", () => {
            test("should fail when admin token not provided", async () => {
                const res = await request()
                    .post("/offer")
                    .send({});

                expect(res.status).toBe(401);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("reason", "Invalid admin token");
            });

            test("should fail when admin token is incorrect", async () => {
                const res = await request()
                    .post("/offer")
                    .send({
                        admin_token: "NotAValidAdminToken!!12345",
                    });

                expect(res.status).toBe(401);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("reason", "Invalid admin token");
            });

            test("should succeed when admin token is correct", async () => {
                const params = {};
                const res = await request()
                    .post("/offer")
                    .send(withAdminToken(params));

                expect(res.status).not.toBe(401);
            });
        });
    });

    describe("Input Validation", () => {
        describe("title", () => {
            fieldIsRequired("title");
            fieldMustBeString("title");
            fieldHasMaxLength("title", 90);
        });

        describe("publishDate", () => {
            fieldIsRequired("publishDate");
            fieldMustBeDate("publishDate");
        });

        describe("endDate", () => {
            fieldIsRequired("endDate");
            fieldMustBeDate("endDate");
        });

        describe("jobMinDuration", () => {
            fieldMustBeNumber("jobMinDuration");
        });

        describe("jobMaxDuration", () => {
            fieldMustBeNumber("jobMaxDuration");
        });

        describe("jobStartDate", () => {
            fieldMustBeDate("jobStartDate");
        });

        describe("description", () => {
            fieldIsRequired("description");
            fieldMustBeString("description");
            fieldHasMaxLength("description", 1500);
        });

        describe("contacts", () => {
            fieldIsRequired("contacts");
        });

        describe("isPaid", () => {
            fieldMustBeBoolean("isPaid");
        });

        describe("vacancies", () => {
            fieldMustBeNumber("vacancies");
        });

        describe("jobType", () => {
            fieldIsRequired("jobType");
            fieldMustBeString("jobType");
            fieldMustBeInArray("jobType", JobTypes);
        });

        describe("fields", () => {
            fieldIsRequired("fields");
            fieldMustBeArrayBetween("fields", FieldTypes.MIN_FIELDS, FieldTypes.MAX_FIELDS);
        });

        describe("technologies", () => {
            fieldIsRequired("technologies");
            fieldMustBeArrayBetween("technologies", TechnologyTypes.MIN_TECHNOLOGIES, TechnologyTypes.MAX_TECHNOLOGIES);
        });

        describe("owner", () => {
            fieldIsRequired("owner");
        });

        describe("location", () => {
            fieldIsRequired("location");
            fieldMustBeString("location");
        });
    });

    describe("Without pre-existing offers", () => {
        beforeAll(async () => {
            await Offer.deleteMany({});
        });

        // TODO: This test should be 'with minimum requirements' and there should be another with all of the optional fields being sent, at least
        test("Should successfully create an Offer", async () => {
            const offer = {
                title: "Test Offer",
                publishDate: "2019-11-17T02:24:15.716Z",
                endDate: "2019-11-18T02:24:15.716Z",
                description: "For Testing Purposes",
                contacts: { email: "geral@niaefeup.pt", phone: "229417766" },
                jobType: "SUMMER INTERNSHIP",
                fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                technologies: ["React", "CSS"],
                owner: "aaa712371273",
                location: "Testing Street, Test City, 123",
            };

            const res = await request()
                .post("/offer")
                .send(withAdminToken(offer));

            expect(res.status).toBe(200);
            const created_offer_id = res.body._id;

            const created_offer = await Offer.findById(created_offer_id);

            expect(created_offer).toBeDefined();
            // Ideally matchers alongside .toMatchObject should be used in order to check created_offer against offer
            // However, no matter what I tried, I couldn't get it to work :upside_down_face:
            expect(created_offer).toHaveProperty("title", offer.title);
            expect(created_offer).toHaveProperty("description", offer.description);
            expect(created_offer).toHaveProperty("location", offer.location);
        });
    });

    describe("Using already created offer", () => {
        const test_offer = {
            title: "Stuff",
        };

        beforeAll(async () => {
            await Offer.deleteMany({});
            await Offer.create([test_offer]);
        });

        test("should provide created offer info", async () => {
            const res = await request()
                .get("/offer")
                .send();

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("data");
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data).toContainEqual(test_offer);
        });
    });
});
