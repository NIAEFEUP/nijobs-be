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
const APIErrorTypes = require("../../src/api/APIErrorTypes");
const { Types } = require("mongoose");
const CompanyConstants = require("../../src/models/constants/Company");

//----------------------------------------------------------------
describe("Offer endpoint tests", () => {
    const generateTestOffer = (publishDate, publishEndDate, isHidden) => ({
        title: "Test Offer",
        publishDate: publishDate || (new Date(Date.now() - (DAY_TO_MS))).toISOString(),
        publishEndDate: publishEndDate || (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
        description: "For Testing Purposes",
        contacts: ["geral@niaefeup.pt", "229417766"],
        jobType: "SUMMER INTERNSHIP",
        fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
        technologies: ["React", "CSS"],
        location: "Testing Street, Test City, 123",
        isHidden: isHidden || false,
    });

    let test_company;

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
        await Company.deleteMany({});
        test_company = await Company.create({
            name: "test company",
            bio: "a bio",
            contacts: ["a contact"]
        });
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

    describe("POST /offers", () => {

        describe("Authentication", () => {

            describe("creating offers requires company account (without god token)", () => {
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

                    const res = await test_agent
                        .post("/offers/new")
                        .send(generateTestOffer());

                    expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                    expect(res.body).toHaveProperty("reason", "Insufficient Permissions");
                });

                test("should create offer if logged in to company account", async () => {

                    // Login
                    const offer = generateTestOffer();
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
                    const params = { ...generateTestOffer(), owner: "invalidowner" };
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
                    const offer = generateTestOffer();
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
                const offer = generateTestOffer();
                const offer_params = {
                    ...offer,
                    owner: test_company._id,
                    ownerName: test_company.name
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

        describe("Before reaching the offers limit while having past offers", () => {
            const testOffers = Array(CompanyConstants.offers.max_concurrent - 1)
                .fill(generateTestOffer(
                    new Date(Date.now() - (DAY_TO_MS)),
                    new Date(Date.now() + (DAY_TO_MS))
                ));

            testOffers.push(generateTestOffer(
                new Date(Date.now() - (3 * (DAY_TO_MS))),
                new Date(Date.now() - (2 * (DAY_TO_MS)))
            ));

            beforeAll(async () => {
                await Offer.deleteMany({});

                testOffers.forEach((offer) => {
                    offer.owner = test_company._id;
                    offer.ownerName = test_company.name;
                });

                await Offer.create(testOffers);
            });

            afterAll(async () => {
                await Offer.deleteMany({});
            });

            test("should be able to create a new offer (past offers do not restrain the company)", async () => {
                const offer_params = {
                    ...generateTestOffer(),
                    owner: test_company._id,
                    ownerName: test_company.name,
                };

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body).toHaveProperty("title", offer_params.title);
                expect(res.body).toHaveProperty("description", offer_params.description);
                expect(res.body).toHaveProperty("location", offer_params.location);
            });
        });

        describe("After reaching the offers limit", () => {
            const testOffers = Array(CompanyConstants.offers.max_concurrent)
                .fill(generateTestOffer(
                    new Date(Date.now() - (DAY_TO_MS)),
                    new Date(Date.now() + (DAY_TO_MS))
                ));

            beforeAll(async () => {
                await Offer.deleteMany({});

                testOffers.forEach((offer) => {
                    offer.owner = test_company._id;
                    offer.ownerName = test_company.name;
                });

                await Offer.create(testOffers);
            });

            afterAll(async () => {
                await Offer.deleteMany({});
            });


            test("should fail to create a new offer", async () => {
                const offer_params = {
                    ...generateTestOffer(),
                    owner: test_company._id,
                    ownerName: test_company.name,
                };

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.CONFLICT);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("reason",
                    ValidationReasons.MAX_CONCURRENT_OFFERS_EXCEEDED(CompanyConstants.offers.max_concurrent));

            });
        });

        describe("Trying to schedule an offer in a time period which reached the offers limit", () => {
            const testOffers = Array(CompanyConstants.offers.max_concurrent)
                .fill(generateTestOffer(
                    new Date(Date.now() + (3 * (DAY_TO_MS))),
                    new Date(Date.now() + (6 * (DAY_TO_MS)))
                ));

            beforeAll(async () => {
                await Offer.deleteMany({});

                testOffers.forEach((offer) => {
                    offer.owner = test_company._id;
                    offer.ownerName = test_company.name;
                });

                await Offer.create(testOffers);
            });

            afterAll(async () => {
                await Offer.deleteMany({});
            });

            test("should fail to schedule a new offer", async () => {
                const offer_params = {
                    ...generateTestOffer(new Date(Date.now() + (4 * (DAY_TO_MS))), new Date(Date.now() + (5 * (DAY_TO_MS)))),
                    owner: test_company._id,
                    ownerName: test_company.name
                };

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.CONFLICT);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("reason",
                    ValidationReasons.MAX_CONCURRENT_OFFERS_EXCEEDED(CompanyConstants.offers.max_concurrent));
            });
        });

        describe("Default values", () => {
            test("publishDate defaults to the current time if not provided", async () => {
                const offer = {
                    title: "Test Offer",
                    publishEndDate: (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
                    description: "For Testing Purposes",
                    contacts: ["geral@niaefeup.pt", "229417766"],
                    jobType: "SUMMER INTERNSHIP",
                    fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                    technologies: ["React", "CSS"],
                    owner: test_company._id,
                    ownerName: test_company.name,
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

            describe("jobMinDuration", () => {
                const FieldValidatorTester = QueryValidatorTester("jobMinDuration");
                FieldValidatorTester.mustBeNumber();
            });

            describe("jobMaxDuration", () => {
                const FieldValidatorTester = QueryValidatorTester("jobMaxDuration");
                FieldValidatorTester.mustBeNumber();
            });

            describe("jobType", () => {
                const FieldValidatorTester = QueryValidatorTester("jobType");
                FieldValidatorTester.mustBeInArray(JobTypes);
            });

            describe("fields", () => {
                const FieldValidatorTester = QueryValidatorTester("fields");
                FieldValidatorTester.mustHaveValuesInRange(FieldTypes.FieldTypes, FieldTypes.MIN_FIELDS + 1);
            });

            describe("technologies", () => {
                const FieldValidatorTester = QueryValidatorTester("technologies");
                FieldValidatorTester.mustHaveValuesInRange(TechnologyTypes.TechnologyTypes, TechnologyTypes.MIN_TECHNOLOGIES + 1);
            });
        });

        describe("Using already created offer(s)", () => {
            let test_company;
            let test_offer;

            beforeAll(async () => {

                await Company.deleteMany({});
                test_company = await Company.create({
                    name: "test company",
                    bio: "a bio",
                    contacts: ["a contact"]
                });

                test_offer = {
                    title: "Test Offer",
                    publishDate: "2019-11-22T00:00:00.000Z",
                    publishEndDate: "2019-11-28T00:00:00.000Z",
                    description: "For Testing Purposes",
                    contacts: ["geral@niaefeup.pt", "229417766"],
                    jobType: "SUMMER INTERNSHIP",
                    fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                    technologies: ["React", "CSS"],
                    owner: test_company._id,
                    ownerName: test_company.name,
                    location: "Testing Street, Test City, 123",
                };

                await Offer.deleteMany({});
                await Offer.create(test_offer);
            });

            const RealDateNow = Date.now;
            const mockCurrentDate = new Date("2019-11-23");

            beforeEach(() => {
                Date.now = () => mockCurrentDate.getTime();
            });

            afterEach(() => {
                Date.now = RealDateNow;
            });

            describe("Only current offers are returned", () => {

                const expired_test_offer = generateTestOffer("2019-11-17", "2019-11-18");
                const future_test_offer = generateTestOffer(
                    (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
                    (new Date(Date.now() + (2 * DAY_TO_MS))).toISOString()
                );

                beforeAll(async () => {

                    [future_test_offer, expired_test_offer]
                        .forEach((offer) => {
                            offer.owner = test_company._id;
                            offer.ownerName = test_company.name;
                        });

                    await Offer.create([expired_test_offer, future_test_offer]);
                });


                test("should provide only current offer info (no expired or future offers)", async () => {
                    const res = await request()
                        .get("/offers");

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(1);
                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"]; delete elem["__v"]; delete elem["score"]; return elem;
                    });
                    const prepared_test_offer = {
                        ...test_offer,
                        isHidden: false,
                        owner: test_offer.owner.toString()
                    };

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
                            delete elem["_id"]; delete elem["__v"];
                            return elem;
                        });

                        const prepared_test_offer = {
                            ...test_offer,
                            isHidden: false,
                            owner: test_offer.owner.toString()
                        };

                        expect(extracted_data).toContainEqual(prepared_test_offer);
                    });
                });
                describe("When showHidden is active", () => {

                    beforeAll(async () => {
                        // Add 1 hidden offer
                        await Offer.deleteMany({});
                        await Offer.create([test_offer, { ...test_offer, isHidden: true }]);

                    });

                    test("Should not return hidden offers by default", async () => {
                        await test_agent
                            .post("/auth/login")
                            .send({
                                email: test_user_company.email,
                                password: test_user_company.password,
                            });

                        const res = await test_agent
                            .get("/offers");

                        expect(res.status).toBe(HTTPStatus.OK);
                        expect(res.body).toHaveLength(1);

                        // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                        const extracted_data = res.body.map((elem) => {
                            delete elem["_id"]; delete elem["__v"];
                            return elem;
                        });

                        const prepared_test_offer = {
                            ...test_offer,
                            isHidden: false,
                            owner: test_offer.owner.toString()
                        };

                        expect(extracted_data).toContainEqual(prepared_test_offer);
                    });

                    test("Only admins can use showHidden", async () => {
                        await test_agent
                            .post("/auth/login")
                            .send({
                                email: test_user_company.email,
                                password: test_user_company.password,
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
                            delete elem["_id"]; delete elem["__v"];
                            return elem;
                        });

                        const prepared_test_offer = {
                            ...test_offer,
                            isHidden: false,
                            owner: test_offer.owner.toString()
                        };

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
                            delete elem["_id"]; delete elem["__v"];
                            return elem;
                        });

                        const prepared_test_offer = {
                            ...test_offer,
                            isHidden: false,
                            owner: test_offer.owner.toString()
                        };

                        expect(extracted_data).toContainEqual(prepared_test_offer);
                    });
                });

            });

            describe("Full text search", () => {

                let portoFrontend;
                let portoBackend;
                let lisboaBackend;
                let niaefeupOffer;

                beforeAll(async () => {
                    portoFrontend = {
                        ...test_offer,
                        location: "Porto",
                        jobType: "FULL-TIME",
                        fields: ["FRONTEND", "OTHER"],
                        jobMinDuration: 3,
                        jobMaxDuration: 6
                    };
                    portoBackend = {
                        ...test_offer,
                        location: "Porto",
                        fields: ["BACKEND", "OTHER"],
                        jobMinDuration: 2,
                        jobMaxDuration: 4
                    };
                    lisboaBackend = {
                        ...test_offer,
                        location: "Lisboa",
                        fields: ["BACKEND", "DEVOPS"]
                    };
                    niaefeupOffer = {
                        ...test_offer,
                        location: "FEUP",
                        fields: ["BLOCKCHAIN", "OTHER"],
                        ownerName: "NIAEFEUP"
                    };
                    await Offer.deleteMany({});
                    await Offer.create([portoBackend, portoFrontend, lisboaBackend, niaefeupOffer]);
                });

                test("should return porto offers", async () => {

                    const res = await request()
                        .get("/offers")
                        .query({
                            value: "porto"
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(2);

                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"]; delete elem["__v"]; delete elem["score"];
                        return elem;
                    });

                    // eslint-disable-next-line no-unused-vars
                    const expected_offers = [portoBackend, portoFrontend].map(({ owner, ...offer }) => ({
                        ...offer,
                        isHidden: false,
                        owner: owner.toString()
                    }));

                    expected_offers.forEach((expected) => {
                        expect(extracted_data).toContainEqual(expected);
                    });
                });

                test("should return niaefeup (company) offers", async () => {

                    const res = await request()
                        .get("/offers")
                        .query({
                            value: "niaefeup"
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(1);

                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"]; delete elem["__v"]; delete elem["score"];
                        return elem;
                    });

                    const prepared_test_offer = {
                        ...niaefeupOffer,
                        isHidden: false,
                        owner: niaefeupOffer.owner.toString()
                    };

                    expect(extracted_data).toContainEqual(prepared_test_offer);
                });

                test("should return porto offers in order", async () => {

                    const res = await request()
                        .get("/offers")
                        .query({
                            value: "porto frontend"
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(2);

                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"]; delete elem["__v"]; delete elem["score"];
                        return elem;
                    });

                    // eslint-disable-next-line no-unused-vars
                    const expected_offers = [portoFrontend, portoBackend].map(({ owner, ...offer }) => ({
                        ...offer,
                        isHidden: false,
                        owner: owner.toString()
                    }));

                    expected_offers.forEach((expected, i) => {
                        expect(extracted_data[i]).toEqual(expected);
                    });
                });

                test("should return porto offers for FULL-TIME", async () => {

                    const res = await request()
                        .get("/offers")
                        .query({
                            value: "porto",
                            jobType: "FULL-TIME"
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(1);

                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"]; delete elem["__v"]; delete elem["score"];
                        return elem;
                    });

                    const prepared_test_offer = {
                        ...portoFrontend,
                        isHidden: false,
                        owner: portoFrontend.owner.toString()
                    };

                    expect(extracted_data).toContainEqual(prepared_test_offer);
                });

                test("should return porto offers with React", async () => {

                    const res = await request()
                        .get("/offers")
                        .query({
                            value: "porto",
                            technologies: ["React"]
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(2);

                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"]; delete elem["__v"]; delete elem["score"];
                        return elem;
                    });

                    // eslint-disable-next-line no-unused-vars
                    const expected_offers = [portoFrontend, portoBackend].map(({ owner, ...offer }) => ({
                        ...offer,
                        isHidden: false,
                        owner: owner.toString()
                    }));

                    expected_offers.forEach((expected) => {
                        expect(extracted_data).toContainEqual(expected);
                    });
                });

                test("should return offers with DEVOPS", async () => {

                    const res = await request()
                        .get("/offers")
                        .query({
                            fields: ["DEVOPS"]
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(1);

                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"]; delete elem["__v"]; delete elem["score"];
                        return elem;
                    });

                    const prepared_test_offer = {
                        ...lisboaBackend,
                        isHidden: false,
                        owner: lisboaBackend.owner.toString()
                    };

                    expect(extracted_data).toContainEqual(prepared_test_offer);
                });

                test("should return porto offers with min duration of 2", async () => {

                    const res = await request()
                        .get("/offers")
                        .query({
                            value: "porto",
                            jobMinDuration: 2
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(2);

                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"]; delete elem["__v"]; delete elem["score"];
                        return elem;
                    });

                    // eslint-disable-next-line no-unused-vars
                    const expected_offers = [portoFrontend, portoBackend].map(({ owner, ...offer }) => ({
                        ...offer,
                        isHidden: false,
                        owner: owner.toString()
                    }));

                    expected_offers.forEach((expected) => {
                        expect(extracted_data).toContainEqual(expected);
                    });
                });

                test("should return porto offers with min duration of 2 and max duration of 4", async () => {

                    const res = await request()
                        .get("/offers")
                        .query({
                            value: "porto",
                            jobMinDuration: 2,
                            jobMaxDuration: 4
                        });
                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(1);

                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"]; delete elem["__v"]; delete elem["score"];
                        return elem;
                    });

                    const prepared_test_offer = {
                        ...portoBackend,
                        isHidden: false,
                        owner: portoBackend.owner.toString()
                    };

                    expect(extracted_data).toContainEqual(prepared_test_offer);
                });
            });
        });
    });

    describe("GET /offers/:offerId", () => {

        beforeAll(async () => {
            await Offer.deleteMany({});
        });

        describe("Id Validation", () => {
            test("should fail if requested an invalid id", async () => {
                const res = await request()
                    .get("/offers/123");

                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.OBJECT_ID);
            });
            test("should fail if an offer does not exist", async () => {
                const id = Types.ObjectId("5facf0cdb8bc30016ee58952");
                const res = await request()
                    .get(`/offers/${id}`);
                expect(res.status).toBe(HTTPStatus.NOT_FOUND);
                expect(res.body).toHaveProperty("reason", APIErrorTypes.OFFER_NOT_FOUND(id));
            });
        });

        describe("Get offer by Id", () => {
            const test_offers = [{}, {}, {}];

            const test_agent = agent();


            beforeAll(async () => {
                await Offer.deleteMany({});

                const createOffer = async (offer) => {
                    const { _id, owner, ownerName } = await Offer.create({
                        ...offer,
                        owner: test_company._id.toString(),
                        ownerName: test_company.name,
                    });
                    return {
                        ...offer,
                        owner: owner.toString(),
                        ownerName,
                        _id: _id.toString()
                    };
                };

                (await Promise.all(test_offers
                    .map((_, i) => createOffer({ ...generateTestOffer(), isHidden: i === 2 }))))
                    .forEach((elem, i) => {
                        test_offers[i] = elem;
                    });
            });

            test("should return offer", async () => {
                const res_1 = await test_agent.get(`/offers/${test_offers[0]._id}`);
                expect(res_1.status).toBe(HTTPStatus.OK);
                const extracted_data_1 = res_1.body;
                expect(extracted_data_1).toMatchObject(test_offers[0]);

                const res_2 = await test_agent.get(`/offers/${test_offers[1]._id}`);
                expect(res_2.status).toBe(HTTPStatus.OK);
                const extracted_data_2 = res_2.body;

                expect(extracted_data_2).toMatchObject(test_offers[1]);
            });

            test("should fail if not admin or owner", async () => {
                const res = await test_agent.get(`/offers/${test_offers[2]._id}`);
                expect(res.status).toBe(HTTPStatus.NOT_FOUND);
            });

            test("should return hidden offer as admin", async () => {
                const hiddenOffer = test_offers[2];
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(200);

                const res = await test_agent.get(`/offers/${hiddenOffer._id}`);
                expect(res.status).toBe(HTTPStatus.OK);

                const extracted_data = res.body;

                expect(extracted_data).toMatchObject(hiddenOffer);
            });

            test("should return hidden offer as company", async () => {
                const hiddenOffer = test_offers[2];
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company)
                    .expect(200);

                const res = await test_agent.get(`/offers/${hiddenOffer._id}`);
                expect(res.status).toBe(HTTPStatus.OK);
                const extracted_data = res.body;

                expect(extracted_data).toMatchObject(hiddenOffer);
            });
        });
    });
});
