const Offer = require("../../src/models/Offer");
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
            expect(res.body).toHaveProperty("success", false);
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
        expect(res.body).toHaveProperty("success", false);
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

const fieldHasMaxLength = (field_name, max_length) => {
    test(`should not be longer than ${max_length} characters`, async () => {
        const params = {
            [field_name]: "a".repeat(max_length + 1),
        };

        const res = await request()
            .post("/offer")
            .send(withAdminToken(params));

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty("success", false);
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
                expect(res.body).toHaveProperty("success", false);
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
                expect(res.body).toHaveProperty("success", false);
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
        });

        describe("endDate", () => {
            fieldIsRequired("endDate");
        });

        describe("description", () => {
            fieldIsRequired("description");
            fieldMustBeString("description");
            fieldHasMaxLength("description", 1500);
        });

        describe("contacts", () => {
            fieldIsRequired("contacts");
        });

        describe("jobType", () => {
            fieldIsRequired("jobType");
        });

        describe("technologies", () => {
            fieldIsRequired("technologies");
        });

        describe("owner", () => {
            fieldIsRequired("owner");
        });

        describe("location", () => {
            fieldIsRequired("location");
        });
    });

    describe("Without pre-existing offers", () => {
        beforeAll(async () => {
            await Offer.deleteMany({});
        });

        test("Should successfully create an Offer", async () => {
            const offer = {
                title: "My First Offer",

            };

            const res = await request()
                .post("/offer")
                .send(offer);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty("success", true);

            const created_offer = await Offer.findOne({ title: offer.title });
            expect(created_offer).toBeDefined();
            expect(created_offer).toHaveProperty("title", offer.title);
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
            expect(res.body).toHaveProperty("success", true);
            expect(res.body).toHaveProperty("data");
            expect(res.body.data).toHaveLength(1);
            expect(res.body.data).toContainEqual(test_offer);
        });
    });
});
