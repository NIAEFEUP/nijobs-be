// const { mockCurrentDate } = require("../testUtils");
const HTTPStatus = require("http-status-codes");
const Offer = require("../../src/models/Offer");
const JobTypes = require("../../src/models/constants/JobTypes");
const FieldTypes = require("../../src/models/constants/FieldTypes");
const TechnologyTypes = require("../../src/models/constants/TechnologyTypes");
const { ErrorTypes } = require("../../src/api/middleware/errorHandler");
const ValidatorTester = require("../utils/ValidatorTester");
const withGodToken = require("../utils/GodToken");
const { DAY_TO_MS } = require("../utils/TimeConstants");
const OfferConstants = require("../../src/models/constants/Offer");
const Account = require("../../src/models/Account");
const Company = require("../../src/models/Company");
const hash = require("../../src/lib/passwordHashing");
const ValidationReasons = require("../../src/api/middleware/validators/validationReasons");

//----------------------------------------------------------------

describe("Offer endpoint tests", () => {
    const offer = {
        title: "Test Offer",
        publishDate: new Date(Date.now() - (DAY_TO_MS)),
        publishEndDate: new Date(Date.now() + (DAY_TO_MS)),
        description: "For Testing Purposes",
        contacts: ["geral@niaefeup.pt", "229417766"],
        jobType: "SUMMER INTERNSHIP",
        fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
        technologies: ["React", "CSS"],
        location: "Testing Street, Test City, 123",
    };

    let test_company;

    beforeAll(async () => {
        await Company.deleteMany({});
        test_company = await Company.create({
            name: "test company",
            bio: "a bio",
            contacts: ["a contact"]
        });
    });

    describe("POST /offers", () => {

        describe("Authentication", () => {

            describe("creating offers requires company account (without god token)", () => {

                const test_agent = agent();
                const test_user_admin = {
                    email: "admin@email.com",
                    password: "password123",
                };
                const test_user_company = {
                    email: "company@email.com",
                    password: "password123",
                };


                beforeAll(async () => {
                    await Account.deleteMany({});
                    await Account.create({
                        email: test_user_admin.email,
                        password: await hash(test_user_admin.password),
                        isAdmin: true
                    });
                    await Account.create({
                        email: test_user_company.email,
                        password: await hash(test_user_company.password),
                        company: test_company._id
                    });
                });

                test("should fail if not logged in", async () => {
                    const res = await request()
                        .post("/offers/new")
                        .send({});

                    expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                    expect(res.body).toHaveProperty("reason", "Insufficient Permissions");
                });

                test("should fail if logged to non-company account", async () => {
                    // Login
                    await test_agent
                        .post("/auth/login")
                        .send(test_user_admin)
                        .expect(200);

                    const res = await request()
                        .post("/offers/new")
                        .send(offer);

                    expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                    expect(res.body).toHaveProperty("reason", "Insufficient Permissions");
                });

                test("should create offer if logged in to company account", async () => {
                    // Login
                    await test_agent
                        .post("/auth/login")
                        .send(test_user_company)
                        .expect(200);

                    const res = await test_agent
                        .post("/offers/new")
                        .send({ ...offer });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveProperty("title", offer.title);
                    expect(res.body).toHaveProperty("description", offer.description);
                    expect(res.body).toHaveProperty("location", offer.location);
                    expect(res.body).toHaveProperty("owner", test_company._id.toString());
                    // TODO: When ownerName is a thing -> expect(res.body).toHaveProperty("ownerName", test_company.name);
                });
            });

            describe("creating offers requires god permissions", () => {
                test("should fail when god token not provided", async () => {
                    const res = await request()
                        .post("/offers/new")
                        .send({});

                    expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                    expect(res.body).toHaveProperty("reason", "Insufficient Permissions");
                });

                test("should fail when god token is incorrect", async () => {
                    const res = await request()
                        .post("/offers/new")
                        .send({
                            god_token: "NotAValidGodToken!!12345",
                        });

                    expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                    expect(res.body).toHaveProperty("reason", "Invalid god token");
                });

                test("should fail when god token is correct but owner doesn't exist", async () => {
                    const params = { ...offer, owner: "invalidowner" };
                    const res = await request()
                        .post("/offers/new")
                        .send(withGodToken(params));

                    expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                    expect(res.body.errors).toContainEqual({
                        value: "invalidowner",
                        location: "body",
                        msg: ValidationReasons.COMPANY_NOT_FOUND("invalidowner"),
                        param: "owner",
                    });

                });

                test("should succeed when god token is correct and owner exists", async () => {
                    const params = { ...offer, owner: test_company._id };
                    const res = await request()
                        .post("/offers/new")
                        .send(withGodToken(params));


                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveProperty("title", offer.title);
                    expect(res.body).toHaveProperty("description", offer.description);
                    expect(res.body).toHaveProperty("location", offer.location);
                });
            });
        });

        const EndpointValidatorTester = ValidatorTester((params) => request().post("/offers/new").send(withGodToken(params)));
        const BodyValidatorTester = EndpointValidatorTester("body");

        describe("Input Validation", () => {
            describe("title", () => {
                const FieldValidatorTester = BodyValidatorTester("title");
                FieldValidatorTester.isRequired();
                FieldValidatorTester.mustBeString();
                FieldValidatorTester.hasMaxLength(OfferConstants.title.max_length);
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
                FieldValidatorTester.hasMaxLength(OfferConstants.description.max_length);
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
                const offer_params = {
                    ...offer,
                    owner: test_company._id,
                };

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

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
            test("publishDate defaults to the current time if not provided", async () => {
                const offer = {
                    title: "Test Offer",
                    publishEndDate: new Date(Date.now() + (DAY_TO_MS)),
                    description: "For Testing Purposes",
                    contacts: ["geral@niaefeup.pt", "229417766"],
                    jobType: "SUMMER INTERNSHIP",
                    fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                    technologies: ["React", "CSS"],
                    owner: test_company._id,
                    location: "Testing Street, Test City, 123",
                };

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer));

                expect(res.status).toBe(HTTPStatus.OK);
                const created_offer_id = res.body._id;

                const created_offer = await Offer.findById(created_offer_id);

                expect(created_offer).toBeDefined();
                expect(created_offer).toHaveProperty("title", offer.title);
                expect(created_offer).toHaveProperty("description", offer.description);
                expect(created_offer).toHaveProperty("location", offer.location);
                expect(created_offer).toHaveProperty("publishDate");
            });
        });
    });

    describe("GET /offers", () => {
        describe("Input Validation", () => {
            const EndpointValidatorTester = ValidatorTester((params) => request().get("/offers").query(params));
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
                    contacts: ["geral@niaefeup.pt", "229417766"],
                    jobType: "SUMMER INTERNSHIP",
                    fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                    technologies: ["React", "CSS"],
                    // owner: Will be set in beforeAll,
                    location: "Testing Street, Test City, 123",
                };
                const expired_test_offer = {
                    title: "Expired Test Offer",
                    publishDate: "2019-11-17",
                    publishEndDate: "2019-11-18",
                    description: "For Testing Purposes",
                    contacts: ["geral@niaefeup.pt", "229417766"],
                    jobType: "SUMMER INTERNSHIP",
                    fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                    technologies: ["React", "CSS"],
                    // owner: Will be set in beforeAll,
                    location: "Testing Street, Test City, 123",
                };
                const future_test_offer = {
                    title: "Future Test Offer",
                    publishDate: "2019-12-12",
                    publishEndDate: "2019-12-22",
                    description: "For Testing Purposes",
                    contacts: ["geral@niaefeup.pt", "229417766"],
                    jobType: "SUMMER INTERNSHIP",
                    fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                    technologies: ["React", "CSS"],
                    // owner: Will be set in beforeAll,
                    location: "Testing Street, Test City, 123",
                };
                let test_company;

                beforeAll(async () => {

                    await Company.deleteMany({});
                    test_company = await Company.create({
                        name: "test company",
                        bio: "a bio",
                        contacts: ["a contact"]
                    });

                    [test_offer, future_test_offer, expired_test_offer]
                        .forEach((offer) => {
                            offer.owner = test_company._id;
                        });

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
                        .get("/offers");

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(1);
                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"]; delete elem["__v"]; delete elem["owner"]; return elem;
                    });
                    const prepared_test_offer = {
                        ...test_offer,
                        isHidden: false,
                        // JSON.parse->JSON.stringify needed because comparison below fails otherwise. Spread operator does not work
                        company: JSON.parse(JSON.stringify(test_company.toObject()))
                    };
                    delete prepared_test_offer["owner"];

                    expect(extracted_data).toContainEqual(prepared_test_offer);
                });

                describe("When a limit is given", () => {
                    beforeAll(async () => {
                        // Add 2 more offers
                        await Offer.deleteMany({});
                        await Offer.create([test_offer, expired_test_offer, future_test_offer, test_offer, test_offer]);
                    });

                    test("Only `limit` number of offers are returned", async () => {
                        const res = await request()
                            .get("/offers")
                            .query({
                                limit: 2,
                            });

                        expect(res.status).toBe(HTTPStatus.OK);
                        expect(res.body).toHaveLength(2);

                        // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                        const extracted_data = res.body.map((elem) => {
                            delete elem["_id"]; delete elem["__v"]; delete elem["owner"];
                            return elem;
                        });

                        const prepared_test_offer = {
                            ...test_offer,
                            isHidden: false,
                            company: JSON.parse(JSON.stringify(test_company.toObject()))
                        };

                        delete prepared_test_offer["owner"];

                        expect(extracted_data).toContainEqual(prepared_test_offer);
                    });
                });
                describe("When showHidden is active", () => {
                    const test_agent = agent();
                    const test_user_admin = {
                        email: "admin@email.com",
                        password: "password123",
                        isAdmin: true
                    };
                    const test_user_non_admin = {
                        email: "company@email.com",
                        password: "password123",
                    };

                    beforeAll(async () => {
                        // Add 1 hidden offer
                        await Offer.deleteMany({});
                        await Offer.create([test_offer, { ...test_offer, isHidden: true }]);

                        await request()
                            .post("/auth/register")
                            .send(withGodToken(test_user_admin));

                        await request()
                            .post("/auth/register")
                            .send(withGodToken(test_user_non_admin));

                    });

                    test("Should not return hidden offers by default", async () => {
                        await test_agent
                            .post("/auth/login")
                            .send({
                                email: test_user_non_admin.email,
                                password: test_user_non_admin.password,
                            });

                        const res = await test_agent
                            .get("/offers");

                        expect(res.status).toBe(HTTPStatus.OK);
                        expect(res.body).toHaveLength(1);

                        // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                        const extracted_data = res.body.map((elem) => {
                            delete elem["_id"]; delete elem["__v"]; delete elem["owner"];
                            return elem;
                        });

                        const prepared_test_offer = {
                            ...test_offer,
                            isHidden: false,
                            company: JSON.parse(JSON.stringify(test_company.toObject()))
                        };

                        delete prepared_test_offer["owner"];

                        expect(extracted_data).toContainEqual(prepared_test_offer);
                    });

                    test("Only admins can use showHidden", async () => {
                        await test_agent
                            .post("/auth/login")
                            .send({
                                email: test_user_non_admin.email,
                                password: test_user_non_admin.password,
                            });

                        const res = await test_agent
                            .get("/offers")
                            .query({
                                showHidden: true,
                            });

                        expect(res.status).toBe(HTTPStatus.OK);
                        expect(res.body).toHaveLength(1);

                        // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                        const extracted_data = res.body.map((elem) => {
                            delete elem["_id"]; delete elem["__v"]; delete elem["owner"];
                            return elem;
                        });

                        const prepared_test_offer = {
                            ...test_offer,
                            isHidden: false,
                            company: JSON.parse(JSON.stringify(test_company.toObject()))
                        };

                        delete prepared_test_offer["owner"];

                        expect(extracted_data).toContainEqual(prepared_test_offer);
                    });

                    test("Only admins can use showHidden (with admin)", async () => {
                        await test_agent
                            .post("/auth/login")
                            .send({
                                email: test_user_admin.email,
                                password: test_user_admin.password,
                            });

                        const res = await test_agent
                            .get("/offers")
                            .query({
                                showHidden: true,
                            });

                        expect(res.status).toBe(HTTPStatus.OK);
                        expect(res.body).toHaveLength(2);

                        // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                        const extracted_data = res.body.map((elem) => {
                            delete elem["_id"]; delete elem["__v"]; delete elem["owner"];
                            return elem;
                        });

                        const prepared_test_offer = {
                            ...test_offer,
                            isHidden: false,
                            company: JSON.parse(JSON.stringify(test_company.toObject()))
                        };

                        delete prepared_test_offer["owner"];

                        expect(extracted_data).toContainEqual(prepared_test_offer);
                    });
                });
            });
        });
    });
});
