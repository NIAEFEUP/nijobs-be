// const { mockCurrentDate } = require("../testUtils");
const HTTPStatus = require("http-status-codes");
const Offer = require("../../src/models/Offer");
const JobTypes = require("../../src/models/JobTypes");
const FieldTypes = require("../../src/models/FieldTypes");
const TechnologyTypes = require("../../src/models/TechnologyTypes");
const { ErrorTypes } = require("../../src/api/middleware/errorHandler");
const ValidatorTester = require("../utils/ValidatorTester");
const withGodToken = require("../utils/GodToken");
const { DAY_TO_MS } = require("../utils/TimeConstants");

//----------------------------------------------------------------

describe("Offer endpoint tests", () => {
    describe("POST /offer", () => {

        describe("Authentication", () => {
            describe("creating offers requires god permissions", () => {
                test("should fail when god token not provided", async () => {
                    const res = await request()
                        .post("/offer")
                        .send({});

                    expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                    expect(res.body).toHaveProperty("reason", "Invalid god token");
                });

                test("should fail when god token is incorrect", async () => {
                    const res = await request()
                        .post("/offer")
                        .send({
                            god_token: "NotAValidGodToken!!12345",
                        });

                    expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                    expect(res.body).toHaveProperty("reason", "Invalid god token");
                });

                test("should succeed when god token is correct", async () => {
                    const params = {};
                    const res = await request()
                        .post("/offer")
                        .send(withGodToken(params));

                    expect(res.status).not.toBe(HTTPStatus.UNAUTHORIZED);
                });
            });
        });

        const EndpointValidatorTester = ValidatorTester((params) => request().post("/offer").send(withGodToken(params)));
        const BodyValidatorTester = EndpointValidatorTester("body");

        describe("Input Validation", () => {
            describe("title", () => {
                const FieldValidatorTester = BodyValidatorTester("title");
                FieldValidatorTester.isRequired();
                FieldValidatorTester.mustBeString();
                FieldValidatorTester.hasMaxLength(90);
            });

            describe("publishDate", () => {
                const FieldValidatorTester = BodyValidatorTester("publishDate");
                FieldValidatorTester.mustBeDate();
            });

            describe("publishEndDate", () => {
                const FieldValidatorTester = BodyValidatorTester("publishEndDate");
                FieldValidatorTester.isRequired();
                FieldValidatorTester.mustBeDate();
                FieldValidatorTester.mustBeFuture();
                FieldValidatorTester.mustBeAfter("publishDate");
            });

            describe("jobMinDuration", () => {
                const FieldValidatorTester = BodyValidatorTester("jobMinDuration");
                FieldValidatorTester.mustBeNumber();
            });

            describe("jobMaxDuration", () => {
                const FieldValidatorTester = BodyValidatorTester("jobMaxDuration");
                FieldValidatorTester.mustBeNumber();
            });

            describe("jobStartDate", () => {
                const FieldValidatorTester = BodyValidatorTester("jobStartDate");
                FieldValidatorTester.mustBeDate();
            });

            describe("description", () => {
                const FieldValidatorTester = BodyValidatorTester("description");
                FieldValidatorTester.isRequired();
                FieldValidatorTester.mustBeString();
                FieldValidatorTester.hasMaxLength(1500);
            });

            describe("contacts", () => {
                const FieldValidatorTester = BodyValidatorTester("contacts");
                FieldValidatorTester.isRequired();
            });

            describe("isPaid", () => {
                const FieldValidatorTester = BodyValidatorTester("isPaid");
                FieldValidatorTester.mustBeBoolean();
            });

            describe("vacancies", () => {
                const FieldValidatorTester = BodyValidatorTester("vacancies");
                FieldValidatorTester.mustBeNumber();
            });

            describe("jobType", () => {
                const FieldValidatorTester = BodyValidatorTester("jobType");
                FieldValidatorTester.isRequired();
                FieldValidatorTester.mustBeString();
                FieldValidatorTester.mustBeInArray(JobTypes);
            });

            describe("fields", () => {
                const FieldValidatorTester = BodyValidatorTester("fields");
                FieldValidatorTester.isRequired();
                FieldValidatorTester.mustBeArrayBetween(FieldTypes.MIN_FIELDS, FieldTypes.MAX_FIELDS);
                FieldValidatorTester.mustHaveValuesInRange(FieldTypes.FieldTypes, FieldTypes.MIN_FIELDS + 1);
            });

            describe("technologies", () => {
                const FieldValidatorTester = BodyValidatorTester("technologies");
                FieldValidatorTester.isRequired();
                FieldValidatorTester.mustBeArrayBetween(TechnologyTypes.MIN_TECHNOLOGIES, TechnologyTypes.MAX_TECHNOLOGIES);
                FieldValidatorTester.mustHaveValuesInRange(TechnologyTypes.TechnologyTypes, TechnologyTypes.MIN_TECHNOLOGIES + 1);
            });

            describe("owner", () => {
                const FieldValidatorTester = BodyValidatorTester("owner");
                FieldValidatorTester.isRequired();
            });

            describe("location", () => {
                const FieldValidatorTester = BodyValidatorTester("location");
                FieldValidatorTester.isRequired();
                FieldValidatorTester.mustBeString();
            });
        });

        describe("Without pre-existing offers", () => {
            beforeAll(async () => {
                await Offer.deleteMany({});
            });

            // TODO: This test should be 'with minimum requirements'
            // Thus, there should be another with all of the optional fields being sent, at least
            test("Should successfully create an Offer", async () => {
                const offer = {
                    title: "Test Offer",
                    publishDate: new Date(Date.now() - (DAY_TO_MS)),
                    publishEndDate: new Date(Date.now() + (DAY_TO_MS)),
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
                    .send(withGodToken(offer));

                expect(res.status).toBe(HTTPStatus.OK);
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

        describe("Default values", () => {
            const RealDateNow = Date.now;
            const mockCurrentDate = new Date("2019-11-23");

            beforeEach(() => {
                Date.now = () => mockCurrentDate.getTime();
            });

            afterEach(() => {
                Date.now = RealDateNow;
            });

            const offer = {
                title: "Test Offer",
                publishEndDate: new Date(Date.now() + (DAY_TO_MS)),
                description: "For Testing Purposes",
                contacts: { email: "geral@niaefeup.pt", phone: "229417766" },
                jobType: "SUMMER INTERNSHIP",
                fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                technologies: ["React", "CSS"],
                owner: "aaa712371273",
                location: "Testing Street, Test City, 123",
            };

            test("publishDate defaults to the current time if not provided", async () => {
                const res = await request()
                    .post("/offer")
                    .send(withGodToken(offer));

                expect(res.status).toBe(HTTPStatus.OK);
                const created_offer_id = res.body._id;

                const created_offer = await Offer.findById(created_offer_id);

                expect(created_offer).toBeDefined();
                expect(created_offer).toHaveProperty("title", offer.title);
                expect(created_offer).toHaveProperty("description", offer.description);
                expect(created_offer).toHaveProperty("location", offer.location);
                expect(created_offer).toHaveProperty("publishDate", new Date(Date.now()));
            });
        });
    });

    describe("GET /offer", () => {
        describe("Input Validation", () => {
            const EndpointValidatorTester = ValidatorTester((params) => request().get("/offer").query(params));
            const QueryValidatorTester = EndpointValidatorTester("query");

            describe("offset", () => {
                const FieldValidatorTester = QueryValidatorTester("offset");
                FieldValidatorTester.mustBeNumber();
            });

            describe("limit", () => {
                const FieldValidatorTester = QueryValidatorTester("limit");
                FieldValidatorTester.mustBeNumber();
            });
        });

        describe("Using already created offer(s)", () => {
            describe("Only current offers are returned", () => {
                const test_offer = {
                    title: "Test Offer",
                    publishDate: "2019-11-22T00:00:00.000Z",
                    publishEndDate: "2019-11-28T00:00:00.000Z",
                    description: "For Testing Purposes",
                    contacts: { email: "geral@niaefeup.pt", phone: "229417766" },
                    jobType: "SUMMER INTERNSHIP",
                    fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                    technologies: ["React", "CSS"],
                    owner: "aaa712371273",
                    location: "Testing Street, Test City, 123",
                };

                const expired_test_offer = {
                    title: "Expired Test Offer",
                    publishDate: "2019-11-17",
                    publishEndDate: "2019-11-18",
                    description: "For Testing Purposes",
                    contacts: { email: "geral@niaefeup.pt", phone: "229417766" },
                    jobType: "SUMMER INTERNSHIP",
                    fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                    technologies: ["React", "CSS"],
                    owner: "aaa712371273",
                    location: "Testing Street, Test City, 123",
                };

                const future_test_offer = {
                    title: "Future Test Offer",
                    publishDate: "2019-12-12",
                    publishEndDate: "2019-12-22",
                    description: "For Testing Purposes",
                    contacts: { email: "geral@niaefeup.pt", phone: "229417766" },
                    jobType: "SUMMER INTERNSHIP",
                    fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                    technologies: ["React", "CSS"],
                    owner: "aaa712371273",
                    location: "Testing Street, Test City, 123",
                };

                // TODO: Create a mock owner Company for this test
                beforeAll(async () => {
                    await Offer.deleteMany({});
                    await Offer.create([test_offer, expired_test_offer, future_test_offer]);
                });

                afterAll(async () => {
                    await Offer.deleteMany({});
                });

                const RealDateNow = Date.now;
                const mockCurrentDate = new Date("2019-11-23");

                beforeEach(() => {
                    Date.now = () => mockCurrentDate.getTime();
                });

                afterEach(() => {
                    Date.now = RealDateNow;
                });

                test("should provide only current offer info (no expired or future offers)", async () => {
                    const res = await request()
                        .get("/offer");

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(1);
                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"]; delete elem["__v"]; delete elem["owner"]; return elem;
                    });
                    const prepared_test_offer = { ...test_offer };
                    delete prepared_test_offer["owner"];

                    expect(extracted_data).toContainEqual(prepared_test_offer);
                });
            });

            describe("When a `limit` is given", () => {
                const test_offer = {
                    title: "Test Offer",
                    publishDate: "2019-11-22T00:00:00.000Z",
                    publishEndDate: "2019-11-28T00:00:00.000Z",
                    description: "For Testing Purposes",
                    contacts: { email: "geral@niaefeup.pt", phone: "229417766" },
                    jobType: "SUMMER INTERNSHIP",
                    fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                    technologies: ["React", "CSS"],
                    owner: "aaa712371273",
                    location: "Testing Street, Test City, 123",
                };

                const N_OFFERS = 5;

                // TODO: Create a mock owner Company for this test
                beforeAll(async () => {
                    await Offer.deleteMany({});
                    const offers = [];
                    for (let i = 0; i < N_OFFERS; ++i) {
                        offers.push(test_offer);
                    }
                    await Offer.create(offers);
                });

                afterAll(async () => {
                    await Offer.deleteMany({});
                });

                const RealDateNow = Date.now;
                const mockCurrentDate = new Date("2019-11-23");

                beforeEach(() => {
                    Date.now = () => mockCurrentDate.getTime();
                });

                afterEach(() => {
                    Date.now = RealDateNow;
                });

                test("Only `limit` number of offers are returned", async () => {
                    const res = await request()
                        .get("/offer")
                        .query({
                            limit: 3,
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(3);

                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"]; delete elem["__v"]; delete elem["owner"]; return elem;
                    });
                    const prepared_test_offer = { ...test_offer };
                    delete prepared_test_offer["owner"];

                    expect(extracted_data).toContainEqual(prepared_test_offer);
                });
            });
        });
    });
});
