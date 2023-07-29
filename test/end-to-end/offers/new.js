import { DAY_TO_MS } from "../../utils/TimeConstants.js";
import Company from "../../../src/models/Company.js";
import Account from "../../../src/models/Account.js";
import hash from "../../../src/lib/passwordHashing.js";
import { StatusCodes as HTTPStatus } from "http-status-codes/build/cjs/status-codes.js";
import ValidationReasons from "../../../src/api/middleware/validators/validationReasons.js";
import { ErrorTypes } from "../../../src/api/middleware/errorHandler.js";
import withGodToken from "../../utils/GodToken.js";
import ValidatorTester from "../../utils/ValidatorTester.js";
import OfferConstants from "../../../src/models/constants/Offer.js";
import JobTypes from "../../../src/models/constants/JobTypes.js";
import * as FieldConstants from "../../../src/models/constants/FieldTypes.js";
import * as TechnologyConstants from "../../../src/models/constants/TechnologyTypes.js";
import Offer from "../../../src/models/Offer.js";
import { MONTH_IN_MS, OFFER_MAX_LIFETIME_MONTHS } from "../../../src/models/constants/TimeConstants.js";
import CompanyConstants from "../../../src/models/constants/Company.js";
import CompanyApplication from "../../../src/models/CompanyApplication.js";

describe("Offer endpoint tests", () => {
    const generateTestOffer = (params) => ({
        title: "Test Offer",
        publishDate: (new Date(Date.now())).toISOString(),
        publishEndDate: (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
        description: "For Testing Purposes",
        contacts: ["geral@niaefeup.pt", "229417766"],
        jobMinDuration: 1,
        jobMaxDuration: 6,
        jobType: "SUMMER INTERNSHIP",
        fields: ["DEVOPS", "BACKEND", "OTHER"],
        technologies: ["React", "CSS"],
        location: "Testing Street, Test City, 123",
        isHidden: false,
        isArchived: false,
        requirements: ["The candidate must be tested", "Fluent in testJS"],
        vacancies: 2,
        ...params,
    });

    let test_company, approved_test_company;

    const test_agent = agent();

    const test_user_admin = {
        email: "admin@email.com",
        password: "password123",
    };
    const test_user_company = {
        email: "company@email.com",
        password: "password123",
    };

    const approved_test_user_company = {
        email: "approvedCompany@email.com",
        password: "password123",
    };

    beforeAll(async () => {

        await Company.deleteMany({});

        await Account.deleteMany({});

        await CompanyApplication.deleteMany({});

        test_company = await Company.create({
            name: "test company",
            bio: "a bio",
            contacts: ["a contact"],
            hasFinishedRegistration: true,
            logo: "http://awebsite.com/alogo.jpg",
        });

        approved_test_company = await Company.create({
            name: " approved test company",
            bio: "a bio",
            contacts: ["a contact"],
            hasFinishedRegistration: true,
            logo: "http://awebsite.com/alogo.jpg",
        });

        await CompanyApplication.create({
            email: test_user_company.email,
            password: test_user_company.password,
            companyName: "test verified company",
            motivation: "I want people for job :)",
            isVerified: true,
            submittedAt: Date.now()
        });

        await CompanyApplication.create({
            email: approved_test_user_company.email,
            password: approved_test_user_company.password,
            companyName: "approved test company",
            motivation: "I want people for job :)",
            isVerified: true,
            submittedAt: Date.now() - 1,
            approvedAt: Date.now(),
        });

        await Account.create({
            email: test_user_admin.email,
            password: await hash(test_user_admin.password),
            isAdmin: true
        });

        await Account.create({
            email: test_user_company.email,
            password: await hash(test_user_company.password),
            company: test_company._id,
        });

        await Account.create({
            email: approved_test_user_company.email,
            password: await hash(approved_test_user_company.password),
            company: approved_test_company._id,
        });

    });

    afterAll(async () => {
        await Company.deleteMany({});
        await Account.deleteMany({});
        await CompanyApplication.deleteMany({});
    });

    describe("POST /offers", () => {

        describe("Authentication", () => {

            describe("creating offers requires company account or admin account (without god token)", () => {
                test("should fail if not logged in", async () => {
                    const res = await request()
                        .post("/offers/new")
                        .send({});

                    expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
                    expect(res.body).toHaveProperty("errors");
                    expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });
                });

                test("should fail if not logged in, even if target owner is specified", async () => {
                    const params = { owner: test_company._id };
                    const offer = generateTestOffer(params);

                    const res = await request()
                        .post("/offers/new")
                        .send(offer);

                    expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
                    expect(res.body).toHaveProperty("errors");
                    expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });
                });

                test("should succeed if logged to admin account", async () => {
                    // Login
                    await test_agent
                        .post("/auth/login")
                        .send(test_user_admin)
                        .expect(200);

                    const params = { owner: test_company._id };
                    const offer = generateTestOffer(params);
                    const res = await test_agent
                        .post("/offers/new")
                        .send(offer);

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveProperty("title", offer.title);
                    expect(res.body).toHaveProperty("description", offer.description);
                    expect(res.body).toHaveProperty("location", offer.location);
                });

                test("should create offer if logged in to company account", async () => {

                    // Login
                    const offer = { ...generateTestOffer() };
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
                    expect(res.body).toHaveProperty("ownerName", test_company.name);
                    expect(res.body).toHaveProperty("ownerLogo", test_company.logo);
                });
            });

            describe("creating offers requires god permissions", () => {
                test("should fail when god token not provided", async () => {
                    const res = await request()
                        .post("/offers/new")
                        .send({});

                    expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                    expect(res.body).toHaveProperty("errors");
                    expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });
                });

                test("should fail when god token is incorrect", async () => {
                    const res = await request()
                        .post("/offers/new")
                        .send({
                            god_token: "NotAValidGodToken!!12345",
                        });

                    expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
                    expect(res.body).toHaveProperty("errors");
                    expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });
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
                FieldValidatorTester.hasMinLength(OfferConstants.title.min_length);
                FieldValidatorTester.hasMaxLength(OfferConstants.title.max_length);
            });

            describe("publishDate", () => {
                const FieldValidatorTester = BodyValidatorTester("publishDate");
                FieldValidatorTester.mustBeDate();
                FieldValidatorTester.mustBeFuture();
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
                FieldValidatorTester.isRequired();
                FieldValidatorTester.mustBeNumber();
            });

            describe("jobMaxDuration", () => {
                const FieldValidatorTester = BodyValidatorTester("jobMaxDuration");
                FieldValidatorTester.isRequired();
                FieldValidatorTester.mustBeNumber();
                FieldValidatorTester.mustBeGreaterThanOrEqualToField("jobMinDuration");
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
                FieldValidatorTester.mustHaveAtLeast(1);
            });

            describe("isPaid", () => {
                const FieldValidatorTester = BodyValidatorTester("isPaid");
                FieldValidatorTester.mustBeBoolean();
            });

            describe("vacancies", () => {
                const FieldValidatorTester = BodyValidatorTester("vacancies");
                FieldValidatorTester.mustBeGreaterThanOrEqualTo(OfferConstants.vacancies.min);
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
                FieldValidatorTester.mustBeArrayBetween(FieldConstants.MIN_FIELDS, FieldConstants.MAX_FIELDS);
                FieldValidatorTester.mustHaveValuesInRange(FieldConstants.FieldTypes, FieldConstants.MIN_FIELDS + 1);
            });

            describe("technologies", () => {
                const FieldValidatorTester = BodyValidatorTester("technologies");
                FieldValidatorTester.isRequired();
                FieldValidatorTester.mustBeArrayBetween(TechnologyConstants.MIN_TECHNOLOGIES, TechnologyConstants.MAX_TECHNOLOGIES);
                FieldValidatorTester.mustHaveValuesInRange(TechnologyConstants.TechnologyTypes, TechnologyConstants.MIN_TECHNOLOGIES + 1);
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

            describe("requirements", () => {
                const FieldValidatorTester = BodyValidatorTester("requirements");
                FieldValidatorTester.isRequired();
            });

            describe("isHidden", () => {
                const FieldValidatorTester = BodyValidatorTester("isHidden");
                FieldValidatorTester.mustBeBoolean();
            });
        });

        describe("Without pre-existing offers", () => {
            beforeAll(async () => {
                await Offer.deleteMany({});
            });

            beforeEach(async () => {
                await Offer.deleteMany({});
            });

            test("Should fail to create an offer due to publish end date being after publish date more than the limit", async () => {
                const offer = generateTestOffer();
                const publishDate = new Date(Date.now());
                const offer_params = {
                    ...offer,
                    owner: test_company._id,
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                    publishDate: publishDate.toISOString(),
                    publishEndDate: (new Date(publishDate.getTime() + (MONTH_IN_MS * OFFER_MAX_LIFETIME_MONTHS) + DAY_TO_MS)).toISOString(),
                };

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));


                expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0]).toHaveProperty("param", "publishEndDate");
                expect(res.body.errors[0]).toHaveProperty("location", "body");
                expect(res.body.errors[0].msg).toEqual(
                    ValidationReasons.MUST_BE_BEFORE(
                        new Date(publishDate.getTime() + (MONTH_IN_MS * OFFER_MAX_LIFETIME_MONTHS)).toISOString()
                    ));
            });

            // TODO: This test should be 'with minimum requirements'
            // Thus, there should be another with all of the optional fields being sent, at least
            test("Should successfully create an Offer", async () => {
                const offer = generateTestOffer();
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
                expect(created_offer).toHaveProperty("ownerName", test_company.name);
                expect(created_offer).toHaveProperty("ownerLogo", test_company.logo);
            });

            test("Offer should be pending if the company hasn't been approved", async () => {
                const offer = generateTestOffer({ owner: test_company._id });
                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer)).expect(HTTPStatus.OK);
                expect(res.body.isPending).toBe(true);
            });

            test("Offer should not be pending if the company has been approved", async () => {
                const offer = generateTestOffer({ owner: approved_test_company._id });
                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer)).expect(HTTPStatus.OK);
                expect(res.body.isPending).toBe(false);
            });

            test("Should succeed to create an offer if the description's length is only shorter than the max \
            without HTML tags", async () => {

                const offer_params = {
                    ...generateTestOffer(),
                    description: `<h1>${"a".repeat(OfferConstants.description.max_length)}</h1>`,
                    owner: test_company._id,
                };

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.OK);

                const created_offer_id = res.body._id;
                const created_offer = await Offer.findById(created_offer_id);

                expect(created_offer).toBeDefined();
                expect(created_offer).toHaveProperty("description", offer_params.description);
            });

            test("Should fail to create an offer if the description's length is longer than the max\
            without HTML tags", async () => {

                const offer_params = {
                    ...generateTestOffer(),
                    description: `<h1>${"a".repeat(OfferConstants.description.max_length + 1)}</h1>`,
                    owner: test_company._id,
                };

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0]).toHaveProperty("param", "description");
                expect(res.body.errors[0]).toHaveProperty("location", "body");
                expect(res.body.errors[0].msg).toEqual(ValidationReasons.TOO_LONG(OfferConstants.description.max_length));
            });

            test("Should fail to create an offer if jobStartDate is specified as null", async () => {
                const offer_params = generateTestOffer({
                    jobStartDate: null,
                    owner: test_company._id
                });

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body.errors).toHaveLength(1);
                expect(res.body.errors[0]).toHaveProperty("param", "jobStartDate");
                expect(res.body.errors[0]).toHaveProperty("location", "body");
                expect(res.body.errors[0].msg).toEqual(ValidationReasons.DATE);
            });


        });

        describe("Before reaching the offers limit while having past offers", () => {
            const testOffers = Array(CompanyConstants.offers.max_concurrent - 1)
                .fill(generateTestOffer({
                    "publishDate": (new Date(Date.now())).toISOString(),
                    "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                }));

            testOffers.push(generateTestOffer({
                "publishDate": (new Date(Date.now() - (3 * DAY_TO_MS))).toISOString(),
                "publishEndDate": (new Date(Date.now() - (2 * DAY_TO_MS))).toISOString()
            }));

            beforeAll(async () => {
                await Offer.deleteMany({});

                testOffers.forEach((offer) => {
                    offer.owner = test_company._id;
                    offer.ownerName = test_company.name;
                    offer.ownerLogo = test_company.logo;
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
                };

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body).toHaveProperty("title", offer_params.title);
                expect(res.body).toHaveProperty("description", offer_params.description);
                expect(res.body).toHaveProperty("location", offer_params.location);
                expect(res.body).toHaveProperty("ownerName", test_company.name);
                expect(res.body).toHaveProperty("ownerLogo", test_company.logo);
            });
        });

        describe("After reaching the offers limit", () => {
            const testOffers = Array(CompanyConstants.offers.max_concurrent)
                .fill(generateTestOffer({
                    "publishDate": (new Date(Date.now())).toISOString(),
                    "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                }));

            beforeAll(async () => {
                await Offer.deleteMany({});

                testOffers.forEach((offer) => {
                    offer.owner = test_company._id;
                    offer.ownerName = test_company.name;
                    offer.ownerLogo = test_company.logo;
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
                };

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.CONFLICT);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual(
                    { msg: ValidationReasons.MAX_CONCURRENT_OFFERS_EXCEEDED(CompanyConstants.offers.max_concurrent) });
            });

            test("should fail to create a new offer (with default publishDate)", async () => {
                const offer_params = {
                    ...generateTestOffer(),
                    owner: test_company._id,
                };
                delete offer_params.publishDate;

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.CONFLICT);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual(
                    { msg: ValidationReasons.MAX_CONCURRENT_OFFERS_EXCEEDED(CompanyConstants.offers.max_concurrent) });
            });
        });

        describe("Trying to schedule an offer in a time period which reached the offers limit", () => {
            const testOffers = Array(CompanyConstants.offers.max_concurrent)
                .fill(generateTestOffer({
                    "publishDate": (new Date(Date.now() + (3 * DAY_TO_MS))).toISOString(),
                    "publishEndDate": (new Date(Date.now() + (6 * DAY_TO_MS))).toISOString()
                }));

            beforeAll(async () => {
                await Offer.deleteMany({});

                testOffers.forEach((offer) => {
                    offer.owner = test_company._id;
                    offer.ownerName = test_company.name;
                    offer.ownerLogo = test_company.logo;
                });

                await Offer.create(testOffers);
            });

            afterAll(async () => {
                await Offer.deleteMany({});
            });

            test("should fail to schedule a new offer", async () => {
                const offer_params = {
                    ...generateTestOffer({
                        "publishDate": (new Date(Date.now() + (4 * DAY_TO_MS))).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (5 * DAY_TO_MS))).toISOString()
                    }),
                    owner: test_company._id,
                };

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.CONFLICT);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual(
                    { msg: ValidationReasons.MAX_CONCURRENT_OFFERS_EXCEEDED(CompanyConstants.offers.max_concurrent) });
            });
        });

        describe("Creating an offer in a time period with more than `max_concurrent` overlapping offers, \
                    without exceeding the limit at any point", () => {
            const testOffers = Array(CompanyConstants.offers.max_concurrent - 2)
                .fill(generateTestOffer({
                    "publishDate": (new Date(Date.now() + (2 * DAY_TO_MS))).toISOString(),
                    "publishEndDate": (new Date(Date.now() + (10 * DAY_TO_MS))).toISOString()
                }));

            testOffers.push(generateTestOffer({
                "publishDate": (new Date(Date.now())).toISOString(),
                "publishEndDate": (new Date(Date.now() + (5 * DAY_TO_MS))).toISOString()
            }));

            testOffers.push(generateTestOffer({
                "publishDate": (new Date(Date.now() + (8 * DAY_TO_MS))).toISOString(),
                "publishEndDate": (new Date(Date.now() + (12 * DAY_TO_MS))).toISOString()
            }));

            beforeAll(async () => {
                await Offer.deleteMany({});

                testOffers.forEach((offer) => {
                    offer.owner = test_company._id;
                    offer.ownerName = test_company.name;
                    offer.ownerLogo = test_company.logo;
                });

                await Offer.create(testOffers);
            });

            test("should succeed to create an offer (the offers limit is never reached at any moment)", async () => {
                const offer_params = generateTestOffer({
                    "publishDate": (new Date(Date.now() + (4 * DAY_TO_MS))).toISOString(),
                    "publishEndDate": (new Date(Date.now() + (9 * DAY_TO_MS))).toISOString(),
                    owner: test_company._id,
                });

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body.publishDate).toBe(offer_params.publishDate);
                expect(res.body.publishEndDate).toBe(offer_params.publishEndDate);
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
                    jobMinDuration: 1,
                    jobMaxDuration: 6,
                    fields: ["DEVOPS", "BACKEND", "OTHER"],
                    technologies: ["React", "CSS"],
                    owner: test_company._id,
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                    location: "Testing Street, Test City, 123",
                    requirements: ["The candidate must be tested", "Fluent in testJS"],
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
                expect(created_offer).toHaveProperty("ownerName", test_company.name);
                expect(created_offer).toHaveProperty("ownerLogo", test_company.logo);
            });
        });

        describe("Job Duration", () => {
            test("should fail if jobMinDuration is greater than jobMaxDuration", async () => {
                const offer_params = generateTestOffer({
                    jobMinDuration: 10,
                    jobMaxDuration: 8,
                    owner: test_company._id,
                });

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty("param", "jobMaxDuration");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.MUST_BE_GREATER_THAN_OR_EQUAL_TO("jobMinDuration"));
            });

            test("should succeed if jobMaxDuration is greater than jobMinDuration", async () => {
                const offer_params = generateTestOffer({
                    jobMinDuration: 8,
                    jobMaxDuration: 10,
                    owner: test_company._id,
                });

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.OK);
            });
        });

        describe("Same 'publishDate' and 'publishEndDate'", () => {

            const date = (new Date(Date.now() + (DAY_TO_MS))).toISOString();
            let offer;

            beforeAll(() => {
                // await Offer.deleteMany({});

                offer = generateTestOffer({
                    publishDate: date,
                    publishEndDate: date,
                    owner: test_company._id,
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                });
            });

            afterAll(async () => {
                await Offer.deleteOne(offer);
            });

            test("should fail if 'publishDate' and 'publishEndDate' have the same value", async () => {

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer));

                expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.MUST_BE_AFTER("publishDate"));
                expect(res.body.errors[0]).toHaveProperty("param", "publishEndDate");
                expect(res.body.errors[0]).toHaveProperty("location", "body");
            });
        });

        describe("Incomplete registration of the offer's company", () => {
            let incomplete_test_company;
            beforeAll(async () => {
                incomplete_test_company = await Company.create({
                    name: "incomplete test company",
                    bio: "a bio",
                    contacts: ["a contact"],
                    hasFinishedRegistration: false,
                    logo: "http://awebsite.com/alogo.jpg",
                });
            });

            afterAll(async () => {
                await Company.deleteOne({ _id: incomplete_test_company._id });
            });

            test("should fail to create offer if the company is not fully registered", async () => {
                const offer_params = {
                    ...generateTestOffer(),
                    owner: incomplete_test_company._id,
                    ownerName: incomplete_test_company.name,
                    ownerLogo: incomplete_test_company.logo,
                };

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params));

                expect(res.status).toBe(HTTPStatus.FORBIDDEN);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual(
                    { msg: ValidationReasons.REGISTRATION_NOT_FINISHED });
            });
        });

        describe("Blocked company", () => {

            let blocked_test_company;
            beforeAll(async () => {
                blocked_test_company = await Company.create({
                    name: "blocked test company",
                    bio: "a bio",
                    contacts: ["a contact"],
                    isBlocked: true,
                    hasFinishedRegistration: true
                });
            });

            test("should fail to create offer if company blocked", async () => {
                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(generateTestOffer({
                        owner: blocked_test_company._id,
                        ownerName: blocked_test_company.name,
                    })));

                expect(res.status).toBe(HTTPStatus.FORBIDDEN);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.COMPANY_BLOCKED);
            });

        });

        describe("Disabled company", () => {

            let disabled_company;

            const disabled_company_user = {
                email: "disabled_company@email.com",
                password: "password123",
            };

            beforeAll(async () => {
                // await Company.deleteMany({});
                // await Offer.deleteMany({});

                disabled_company = await Company.create({
                    name: "test company",
                    bio: "a bio",
                    contacts: ["a contact"],
                    hasFinishedRegistration: true,
                    logo: "http://awebsite.com/alogo.jpg",
                    isDisabled: true,
                });

                await Account.create({
                    email: disabled_company_user.email,
                    password: await hash(disabled_company_user.password),
                    company: disabled_company._id
                });
            });

            test("Should not create offer if company is disabled, logged in as same company", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(disabled_company_user)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .post("/offers/new")
                    .send(generateTestOffer());

                expect(res.status).toBe(HTTPStatus.FORBIDDEN);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({ msg: ValidationReasons.COMPANY_DISABLED });
            });
        });

        describe("applyURL validation", () => {
            beforeAll(async () => {
                await Offer.deleteMany({});
            });

            beforeEach(async () => {
                await Offer.deleteMany({});
            });

            test("should fail if applyURL is neither a URL or an email", async () => {
                const offer_params = generateTestOffer({
                    applyURL: "this_is_not_valid",
                    owner: test_company._id,
                });

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params))
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body.errors[0]).toHaveProperty("param", "applyURL");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.BAD_APPLY_URL);
            });

            test("should fail if applyURL is a URL with an unsupported protocol", async () => {
                const offer_params = generateTestOffer({
                    applyURL: "ftp://www.coolwebsite.com",
                    owner: test_company._id,
                });

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params))
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body.errors[0]).toHaveProperty("param", "applyURL");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.BAD_APPLY_URL);
            });

            test("should fail if applyURL contains javascript code", async () => {
                const offer_params = generateTestOffer({
                    applyURL: "javascript:alert('hello friend');",
                    owner: test_company._id,
                });

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params))
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body.errors[0]).toHaveProperty("param", "applyURL");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.BAD_APPLY_URL);
            });

            test("should fail if applyURL contains javascript code with a commented valid URL", async () => {
                const offer_params = generateTestOffer({
                    applyURL: "javascript:alert('hello friend'); // https://www.google.com",
                    owner: test_company._id,
                });

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params))
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body.errors[0]).toHaveProperty("param", "applyURL");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.BAD_APPLY_URL);
            });

            test("should succeed if applyURL is a valid email", async () => {
                const applyURL = "mailto:nicemail@gmail.com";
                const offer_params = generateTestOffer({
                    applyURL,
                    owner: test_company._id,
                });

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params))
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("applyURL", applyURL);
            });

            test("should succeed if applyURL is a valid HTTP URL", async () => {
                const applyURL = "http://www.coolwebsite.com/a/";
                const offer_params = generateTestOffer({
                    applyURL,
                    owner: test_company._id,
                });

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params))
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("applyURL", applyURL);
            });

            test("should succeed if applyURL is a valid HTTPS URL", async () => {
                const applyURL = "https://www.coolwebsite.com";
                const offer_params = generateTestOffer({
                    applyURL,
                    owner: test_company._id,
                });

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params))
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("applyURL", applyURL);
            });

            test("should fail if applyURL is an invalid HTTPS URL", async () => {
                const applyURL = "https://invalid";
                const offer_params = generateTestOffer({
                    applyURL,
                    owner: test_company._id,
                });

                const res = await request()
                    .post("/offers/new")
                    .send(withGodToken(offer_params))
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body.errors[0]).toHaveProperty("param", "applyURL");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.BAD_APPLY_URL);
            });
        });

    });
});
