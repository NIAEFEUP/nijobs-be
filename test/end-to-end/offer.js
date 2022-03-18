import HTTPStatus from "http-status-codes";
import Offer from "../../src/models/Offer";
import JobTypes from "../../src/models/constants/JobTypes";
import * as FieldConstants from "../../src/models/constants/FieldTypes";
import * as TechnologyConstants from "../../src/models/constants/TechnologyTypes";
import { ErrorTypes } from "../../src/api/middleware/errorHandler";
import ValidatorTester from "../utils/ValidatorTester";
import withGodToken from "../utils/GodToken";
import { DAY_TO_MS } from "../utils/TimeConstants";
import OfferConstants from "../../src/models/constants/Offer";
import Account from "../../src/models/Account";
import Company from "../../src/models/Company";
import hash from "../../src/lib/passwordHashing";
import ValidationReasons from "../../src/api/middleware/validators/validationReasons";
import { Types } from "mongoose";
import CompanyConstants from "../../src/models/constants/Company";
import {
    MONTH_IN_MS,
    OFFER_MAX_LIFETIME_MONTHS
} from "../../src/models/constants/TimeConstants";
import OfferService from "../../src/services/offer";
import EmailService from "../../src/lib/emailService";
import { OFFER_DISABLED_NOTIFICATION } from "../../src/email-templates/companyOfferDisabled";

//----------------------------------------------------------------
describe("Offer endpoint tests", () => {
    const generateTestOffer = (params) => ({
        title: "Test Offer",
        publishDate: (new Date(Date.now() - (DAY_TO_MS))).toISOString(),
        publishEndDate: (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
        description: "For Testing Purposes",
        contacts: ["geral@niaefeup.pt", "229417766"],
        jobType: "SUMMER INTERNSHIP",
        fields: ["DEVOPS", "BACKEND", "OTHER"],
        technologies: ["React", "CSS"],
        location: "Testing Street, Test City, 123",
        isHidden: false,
        requirements: ["The candidate must be tested", "Fluent in testJS"],
        ...params,
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
            contacts: ["a contact"],
            hasFinishedRegistration: true,
            logo: "http://awebsite.com/alogo.jpg",
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

            describe("creating offers requires company account or admin account (without god token)", () => {
                test("should fail if not logged in", async () => {
                    const res = await request()
                        .post("/offers/new")
                        .send({});

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
                const publishDate = new Date(Date.now() - (DAY_TO_MS));
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
                    "publishDate": (new Date(Date.now() - (DAY_TO_MS))).toISOString(),
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
                    "publishDate": (new Date(Date.now() - (DAY_TO_MS))).toISOString(),
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
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.MUST_BE_AFTER("jobMinDuration"));
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

            test("should fail if jobMaxDuration is specified and jobMinDuration isn't", async () => {
                const offer_params = generateTestOffer({
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
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.JOB_MIN_DURATION_NOT_SPECIFIED);
            });

            test("should succeed if jobMinDuration is specified and jobMaxDuration isn't", async () => {
                const offer_params = generateTestOffer({
                    jobMinDuration: 8,
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
                await Offer.deleteMany({ offer });
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

    });

    describe("GET /offers", () => {
        describe("Input Validation", () => {
            const EndpointValidatorTester = ValidatorTester((params) => request().get("/offers").query(params));
            const QueryValidatorTester = EndpointValidatorTester("query");

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
                FieldValidatorTester.mustHaveValuesInRange(FieldConstants.FieldTypes, FieldConstants.MIN_FIELDS + 1);
            });

            describe("technologies", () => {
                const FieldValidatorTester = QueryValidatorTester("technologies");
                FieldValidatorTester.mustHaveValuesInRange(TechnologyConstants.TechnologyTypes, TechnologyConstants.MIN_TECHNOLOGIES + 1);
            });
        });

        describe("Using already created offer(s)", () => {
            let test_company;
            let test_offer;

            const testPublishDate = "2019-11-22T00:00:00.000Z";
            const testPublishEndDate = "2019-11-28T00:00:00.000Z";

            beforeAll(async () => {
                test_company = await Company.create({
                    name: "test company",
                    bio: "a bio",
                    contacts: ["a contact"],
                    logo: "http://awebsite.com/alogo.jpg",
                });

                test_offer = {
                    ...generateTestOffer({
                        "publishDate": testPublishDate,
                        "publishEndDate": testPublishEndDate
                    }),
                    owner: test_company._id,
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
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

            describe("queryToken validation", () => {
                test("should fail if queryToken does not contain a valid id", async () => {
                    const { queryToken } = (new OfferService()).buildQueryToken({ _id: "123" });

                    const res = await request()
                        .get("/offers")
                        .query({ queryToken });

                    expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                    expect(res.body).toHaveProperty("errors");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
                    expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
                    expect(res.body.errors[0]).toHaveProperty("location", "query");
                });

                test("should fail if the queryToken's offer does not exist", async () => {
                    const { queryToken } = (new OfferService()).buildQueryToken({ _id: "5facf0cdb8bc30016ee58952" });
                    const res = await request()
                        .get("/offers")
                        .query({ queryToken });

                    expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                    expect(res.body).toHaveProperty("errors");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
                    expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
                    expect(res.body.errors[0]).toHaveProperty("location", "query");
                });

                test("should fail if the queryToken's score is not a number", async () => {
                    const testOfferId = (await Offer.findOne({}))._id;
                    const { queryToken } = (new OfferService())
                        .buildQueryToken({ _id: testOfferId, score: "hello" });

                    const res = await request()
                        .get("/offers")
                        .query({ queryToken, value: "test" });

                    expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                    expect(res.body).toHaveProperty("errors");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
                    expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
                    expect(res.body.errors[0]).toHaveProperty("location", "query");
                });

                test("should fail if the queryToken's score is negative", async () => {
                    const testOfferId = (await Offer.findOne({}))._id;
                    const { queryToken } = (new OfferService())
                        .buildQueryToken({ _id: testOfferId, score: -5 });

                    const res = await request()
                        .get("/offers")
                        .query({ queryToken, value: "test" });

                    expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                    expect(res.body).toHaveProperty("errors");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
                    expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
                    expect(res.body.errors[0]).toHaveProperty("location", "query");
                });

                test("should fail if value is present and the queryToken's score is missing", async () => {
                    const testOfferId = (await Offer.findOne({}))._id;
                    const { queryToken } = (new OfferService())
                        .buildQueryToken({ _id: testOfferId });

                    const res = await request()
                        .get("/offers")
                        .query({ queryToken, value: "test" });

                    expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                    expect(res.body).toHaveProperty("errors");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
                    expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
                    expect(res.body.errors[0]).toHaveProperty("location", "query");
                });

                test("should succeed when value and queryToken's score are missing", async () => {
                    const testOfferId = (await Offer.findOne({}))._id;
                    const { queryToken } = (new OfferService())
                        .buildQueryToken({ _id: testOfferId });

                    const res = await request()
                        .get("/offers")
                        .query({ queryToken });

                    expect(res.status).toBe(HTTPStatus.OK);
                });

                test("should succeed when value is present and queryToken's score is a number", async () => {
                    const testOfferId = (await Offer.findOne({}))._id;
                    const { queryToken } = (new OfferService())
                        .buildQueryToken({ _id: testOfferId, score: 5 });

                    const res = await request()
                        .get("/offers")
                        .query({ queryToken, value: "test" });

                    expect(res.status).toBe(HTTPStatus.OK);
                });

                test("should succeed when value is present and queryToken's score can be parsed as a number", async () => {
                    const testOfferId = (await Offer.findOne({}))._id;
                    const { queryToken } = (new OfferService())
                        .buildQueryToken({ _id: testOfferId, score: "3.5" });

                    const res = await request()
                        .get("/offers")
                        .query({ queryToken, value: "test" });

                    expect(res.status).toBe(HTTPStatus.OK);
                });
            });

            describe("Only current offers are returned", () => {


                const future_test_offer = generateTestOffer({
                    "publishDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
                    "publishEndDate": (new Date(Date.now() + (2 * DAY_TO_MS))).toISOString()
                });

                beforeAll(async () => {

                    [future_test_offer]
                        .forEach((offer) => {
                            offer.owner = test_company._id;
                            offer.ownerName = test_company.name;
                            offer.ownerLogo = test_company.logo;
                        });

                    await Offer.create([future_test_offer]);
                });


                test("should provide only current offer info (no expired or future offers with no value query)", async () => {
                    const res = await request()
                        .get("/offers");

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(1);

                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"];
                        delete elem["__v"];
                        delete elem["createdAt"];
                        delete elem["updatedAt"];
                        delete elem["score"];
                        delete elem["queryToken"];
                        return elem;
                    });
                    const prepared_test_offer = {
                        ...test_offer,
                        isHidden: false,
                        owner: test_offer.owner.toString()
                    };

                    expect(extracted_data).toContainEqual(prepared_test_offer);
                });

                test("should provide only current offer info (no expired or future offers with some value query)", async () => {
                    const res = await request()
                        .get("/offers")
                        .query({
                            value: "test",
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(1);
                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"];
                        delete elem["__v"];
                        delete elem["createdAt"];
                        delete elem["updatedAt"];
                        delete elem["score"];
                        delete elem["queryToken"];
                        return elem;
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
                        await Offer.create([test_offer,  future_test_offer, test_offer, test_offer]);
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
                            delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                            delete elem["updatedAt"]; delete elem["queryToken"];
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

                describe("When queryToken is given", () => {

                    beforeAll(async () => {
                        // Add another offer
                        await Offer.deleteMany({});
                        await Offer.create([test_offer, { ...test_offer, jobType: "FULL-TIME" },
                            expired_test_offer, future_test_offer]);
                    });

                    test("should fetch offers with the id greater than the one provided", async () => {
                        const res = await request()
                            .get("/offers");

                        expect(res.status).toBe(HTTPStatus.OK);
                        expect(res.body).toHaveLength(2);

                        const res2 = await request()
                            .get("/offers")
                            .query({ queryToken: res.body[0].queryToken });

                        expect(res2.status).toBe(HTTPStatus.OK);
                        expect(res2.body).toHaveLength(1);

                        const offer = res2.body[0];
                        expect(offer._id).not.toBe(res.body[0]._id);
                    });

                    test("should succeed if there are no more offers after the last one", async () => {
                        const res = await request()
                            .get("/offers");

                        expect(res.status).toBe(HTTPStatus.OK);
                        expect(res.body).toHaveLength(2);

                        const res2 = await request()
                            .get("/offers")
                            .query({ queryToken: res.body[1].queryToken });

                        expect(res2.status).toBe(HTTPStatus.OK);
                        expect(res2.body).toHaveLength(0);
                    });

                    test("offers are returned according to filters", async () => {
                        const res = await request()
                            .get("/offers")
                            .query({
                                publishDate: testPublishDate,
                                publishEndDate: testPublishEndDate,
                                jobType: "FULL-TIME"
                            });

                        expect(res.status).toBe(HTTPStatus.OK);
                        expect(res.body).toHaveLength(1);
                        expect(res.body[0].jobType).toBe("FULL-TIME");
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
                            delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                            delete elem["updatedAt"]; delete elem["queryToken"];
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
                            delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                            delete elem["updatedAt"]; delete elem["queryToken"];
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
                            delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                            delete elem["updatedAt"]; delete elem["queryToken"];
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

                describe("showAdminReason", () => {

                    beforeAll(async () => {
                        await Offer.deleteMany({});
                        const test_offers = [];

                        for (let i = 0; i < 5; i++)
                            test_offers.push(
                                { ...test_offer,
                                    isHidden: true,
                                    hiddenReason: "ADMIN_REQUEST",
                                    adminReason: "my_reason"
                                });

                        await Offer.create(test_offers);
                    });

                    afterEach(async () => {
                        await test_agent.del("/auth/login");
                    });

                    test("should return adminReason if logged as admin", async () => {

                        await test_agent
                            .post("/auth/login")
                            .send(test_user_admin)
                            .expect(HTTPStatus.OK);

                        const res = await test_agent
                            .get("/offers")
                            .query({
                                showHidden: true,
                            });

                        expect(res.status).toBe(HTTPStatus.OK);

                        const extracted_data = res.body.map((elem) => elem["adminReason"]);

                        const expected_data = ["my_reason", "my_reason", "my_reason", "my_reason", "my_reason"];

                        expect(extracted_data).toEqual(expected_data);
                    });

                    test("should return adminReason if god token is sent", async () => {

                        const res = await test_agent
                            .get("/offers")
                            .query({
                                showHidden: true,
                            })
                            .send(withGodToken());

                        expect(res.status).toBe(HTTPStatus.OK);

                        const extracted_data = res.body.map((elem) => elem["adminReason"]);

                        const expected_data = ["my_reason", "my_reason", "my_reason", "my_reason", "my_reason"];

                        expect(extracted_data).toEqual(expected_data);
                    });

                    test("should not return adminReason if logged as company", async () => {

                        await test_agent
                            .post("/auth/login")
                            .send(test_user_company)
                            .expect(HTTPStatus.OK);

                        const res = await test_agent
                            .get("/offers");

                        expect(res.status).toBe(HTTPStatus.OK);

                        const extracted_data = res.body.map((elem) => elem["adminReason"]);

                        const expected_data = [];

                        expect(extracted_data).toEqual(expected_data);

                    });

                    test("should not return adminReason if not logged in", async () => {

                        const res = await test_agent
                            .get("/offers");

                        expect(res.status).toBe(HTTPStatus.OK);

                        const extracted_data = res.body.map((elem) => elem["adminReason"]);

                        const expected_data = [];

                        expect(extracted_data).toEqual(expected_data);

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
                        title: "This offer is from Porto",
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
                        delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                        delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
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
                        delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                        delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
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
                        delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                        delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
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
                        delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                        delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
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
                        delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                        delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
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
                        delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                        delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
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
                        delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                        delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
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

                    // This test should include the 3-6 offer as well, since [3,6] intersects [2,4]

                    const res = await request()
                        .get("/offers")
                        .query({
                            value: "porto",
                            jobMinDuration: 2,
                            jobMaxDuration: 4
                        });
                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(2);

                    // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                    const extracted_data = res.body.map((elem) => {
                        delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                        delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
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

                describe("When queryToken and value are given", () => {

                    test("should return next matching offer with lower score", async () => {
                        const res = await request()
                            .get("/offers")
                            .query({
                                value: "porto",
                            });

                        expect(res.status).toBe(HTTPStatus.OK);
                        expect(res.body).toHaveLength(2);
                        expect(res.body[0].title).toEqual(portoFrontend.title);

                        const res2 = await request()
                            .get("/offers")
                            .query({
                                value: "porto",
                                queryToken: res.body[0].queryToken
                            });

                        expect(res2.status).toBe(HTTPStatus.OK);
                        expect(res2.body).toHaveLength(1);
                        expect(res2.body[0].title).toEqual(portoBackend.title);
                    });

                    test("should return next matching offer with the same score", async () => {
                        const res = await request()
                            .get("/offers")
                            .query({
                                value: "backend",
                            });

                        expect(res.status).toBe(HTTPStatus.OK);
                        expect(res.body).toHaveLength(2);

                        const res2 = await request()
                            .get("/offers")
                            .query({
                                value: "backend",
                                queryToken: res.body[0].queryToken
                            });

                        expect(res2.status).toBe(HTTPStatus.OK);
                        expect(res2.body).toHaveLength(1);
                    });

                    describe("With not current offers", () => {

                        const expired_test_offer = generateTestOffer({
                            "publishDate": (new Date(Date.now() - (2 * DAY_TO_MS))).toISOString(),
                            "publishEndDate": (new Date(Date.now() - (DAY_TO_MS))).toISOString()
                        });
                        const future_test_offer = generateTestOffer({
                            "publishDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
                            "publishEndDate": (new Date(Date.now() + (2 * DAY_TO_MS))).toISOString()
                        });

                        beforeAll(async () => {

                            [future_test_offer, expired_test_offer]
                                .forEach((offer) => {
                                    offer.owner = test_company._id;
                                    offer.ownerName = test_company.name;
                                    offer.ownerLogo = test_company.logo;
                                });

                            await Offer.create([expired_test_offer, future_test_offer]);
                        });

                        afterAll(async () => {
                            await Offer.deleteOne(future_test_offer);
                            await Offer.deleteOne(expired_test_offer);
                        });

                        test("should provide only current offers", async () => {
                            const res = await request()
                                .get("/offers")
                                .query({
                                    value: "porto",
                                });

                            expect(res.status).toBe(HTTPStatus.OK);
                            expect(res.body).toHaveLength(2);

                            const res2 = await request()
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    queryToken: res.body[0].queryToken
                                });

                            expect(res2.status).toBe(HTTPStatus.OK);
                            expect(res2.body).toHaveLength(1);

                            res2.body.forEach((offer) => {
                                expect(offer.publishDate <= new Date(Date.now()).toISOString()).toBeTruthy();
                                expect(offer.publishEndDate >= new Date(Date.now()).toISOString()).toBeTruthy();
                            });
                        });
                    });

                    describe("When queryToken and value are provided and showHidden is active", () => {

                        beforeAll(async () => {
                            await Offer.create({
                                ...portoFrontend,
                                isHidden: true,
                                title: "This offer is hidden"
                            });
                        });

                        afterAll(async () => {
                            await Offer.deleteOne({ isHidden: true });
                        });

                        test("should not return hidden offers by default", async () => {
                            const res = await request()
                                .get("/offers")
                                .query({
                                    value: "porto",
                                });

                            expect(res.status).toBe(HTTPStatus.OK);
                            expect(res.body).toHaveLength(2);

                            const res2 = await request()
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    queryToken: res.body[0].queryToken
                                });

                            expect(res2.status).toBe(HTTPStatus.OK);
                            expect(res2.body).toHaveLength(1);

                            res2.body.forEach((offer) => {
                                expect(offer.isHidden).toBeFalsy();
                            });
                        });

                        test("companies should not see their hidden offers", async () => {
                            await test_agent
                                .post("/auth/login")
                                .send(test_user_company)
                                .expect(HTTPStatus.OK);

                            const res = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    showHidden: true
                                });

                            expect(res.status).toBe(HTTPStatus.OK);
                            expect(res.body).toHaveLength(2);

                            const res2 = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    queryToken: res.body[0].queryToken
                                });

                            expect(res2.status).toBe(HTTPStatus.OK);
                            expect(res2.body).toHaveLength(1);

                            res2.body.forEach((offer) => {
                                expect(offer.isHidden).toBeFalsy();
                            });
                        });

                        test("admins should see hidden offers", async () => {
                            await test_agent
                                .post("/auth/login")
                                .send(test_user_admin)
                                .expect(HTTPStatus.OK);

                            const res = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    showHidden: true
                                });

                            expect(res.status).toBe(HTTPStatus.OK);
                            expect(res.body).toHaveLength(3);

                            const res2 = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    showHidden: true,
                                    queryToken: res.body[0].queryToken
                                });

                            expect(res2.status).toBe(HTTPStatus.OK);
                            expect(res2.body).toHaveLength(2);
                        });

                        test("should see hidden offers if god token is sent", async () => {
                            const res = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    showHidden: true
                                })
                                .send(withGodToken());

                            expect(res.status).toBe(HTTPStatus.OK);
                            expect(res.body).toHaveLength(3);

                            const res2 = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    showHidden: true,
                                    queryToken: res.body[0].queryToken
                                })
                                .send(withGodToken());

                            expect(res2.status).toBe(HTTPStatus.OK);
                            expect(res2.body).toHaveLength(2);
                        });
                    });

                    describe("When queryToken and value are provided and adminReason is set", () => {
                        beforeAll(async () => {
                            await Offer.create({
                                ...portoFrontend,
                                title: "This offer was hidden by an admin",
                                isHidden: true,
                                hiddenReason: "ADMIN_REQUEST",
                                adminReason: "test_reason"
                            });
                        });

                        afterAll(async () => {
                            await Offer.deleteOne({ isHidden: true });
                        });

                        test("should return adminReason if logged in as admin", async () => {
                            await test_agent
                                .post("/auth/login")
                                .send(test_user_admin)
                                .expect(HTTPStatus.OK);

                            const res = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    showHidden: true,
                                });

                            expect(res.status).toBe(HTTPStatus.OK);
                            expect(res.body).toHaveLength(3);

                            const res2 = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    showHidden: true,
                                    queryToken: res.body[0].queryToken
                                });

                            expect(res2.status).toBe(HTTPStatus.OK);
                            expect(res2.body).toHaveLength(2);

                            res2.body.filter((offer) => offer.isHidden).forEach((offer) => {
                                expect(offer.hiddenReason).toBe("ADMIN_REQUEST");
                                expect(offer.adminReason).toBe("test_reason");
                            });
                        });

                        test("should return adminReason if god token is sent", async () => {
                            const res = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    showHidden: true,
                                })
                                .send(withGodToken());

                            expect(res.status).toBe(HTTPStatus.OK);
                            expect(res.body).toHaveLength(3);

                            const res2 = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    showHidden: true,
                                    queryToken: res.body[0].queryToken
                                });

                            expect(res2.status).toBe(HTTPStatus.OK);
                            expect(res2.body).toHaveLength(2);

                            res2.body.filter((offer) => offer.isHidden).forEach((offer) => {
                                expect(offer.hiddenReason).toBe("ADMIN_REQUEST");
                                expect(offer.adminReason).toBe("test_reason");
                            });
                        });

                        test("companies should not see admin reason for their own offers", async () => {
                            await test_agent
                                .post("/auth/login")
                                .send(test_user_company)
                                .expect(HTTPStatus.OK);

                            const res = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    showHidden: true
                                });

                            expect(res.status).toBe(HTTPStatus.OK);
                            expect(res.body).toHaveLength(2);
                            res.body.forEach((offer) => {
                                expect(offer.adminReason).toBeUndefined();
                            });

                            const res2 = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    showHidden: true,
                                    queryToken: res.body[0].queryToken
                                });

                            expect(res2.status).toBe(HTTPStatus.OK);
                            expect(res2.body).toHaveLength(1);
                            res2.body.forEach((offer) => {
                                expect(offer.adminReason).toBeUndefined();
                            });
                        });

                        test("should not return admin reason if not logged in", async () => {
                            const res = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    showHidden: true
                                });

                            expect(res.status).toBe(HTTPStatus.OK);
                            expect(res.body).toHaveLength(2);
                            res.body.forEach((offer) => {
                                expect(offer.adminReason).toBeUndefined();
                            });

                            const res2 = await test_agent
                                .get("/offers")
                                .query({
                                    value: "porto",
                                    showHidden: true,
                                    queryToken: res.body[0].queryToken
                                });

                            expect(res2.status).toBe(HTTPStatus.OK);
                            expect(res2.body).toHaveLength(1);
                            res2.body.forEach((offer) => {
                                expect(offer.adminReason).toBeUndefined();
                            });
                        });
                    });
                });
            });

            describe("Offer requirements", () => {

                beforeAll(async () => {
                    await Offer.deleteMany();
                    await Offer.create(test_offer);
                });

                test("should return an array of requirements", async () => {

                    const res = await request()
                        .get("/offers");

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveLength(1);
                    expect(res.body[0].requirements).toEqual(test_offer.requirements);
                });
            });
        });
    });

    describe("GET /offers/company/:companyId", () => {
        beforeAll(async () => {
            await Offer.deleteMany({});
        });

        describe("Id Validation", () => {
            test("should fail if requested an invalid companyId", async () => {
                const companyId = "123";
                const res = await request()
                    .get(`/offers/company/${companyId}`);

                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.OBJECT_ID);
            });

            test("should fail if there isn't a company with that id", async () => {
                const missingCompanyId = "60ddb0bb2849830020883f91";
                const res = await request().get(`/offers/company/${missingCompanyId}`);

                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.COMPANY_NOT_FOUND(missingCompanyId));
            });
        });

        describe("Get offer by companyId", () => {
            const test_offers = [{}, {}, {}, {}];
            const test_agent = agent();

            beforeAll(async () => {
                await Offer.deleteMany({});

                const createOffer = async (offer) => {
                    const { _id, owner, ownerName, ownerLogo } = await Offer.create({
                        ...offer,
                        owner: test_company._id.toString(),
                        ownerName: test_company.name,
                        ownerLogo: test_company.logo,
                    });
                    return {
                        ...offer,
                        owner: owner.toString(),
                        ownerName,
                        ownerLogo,
                        _id: _id.toString()
                    };
                };

                (await Promise.all(test_offers
                    .map((_, i) => createOffer({ ...generateTestOffer(), isHidden: i === 2 }))))
                    .forEach((elem, i) => {
                        test_offers[i] = elem;
                    });
            });

            test("should return hidden company offers as company", async () => {
                // Login wiht test_user_company
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company)
                    .expect(HTTPStatus.OK);

                const res = await test_agent.get(`/offers/company/${test_company._id}`);
                expect(res.status).toBe(HTTPStatus.OK);

                const extractedData = res.body;
                expect(extractedData.map((offer) => offer._id).sort())
                    .toMatchObject(
                        test_offers.map((offer) => offer._id).sort()
                    );

                // Logout
                await test_agent
                    .del("/auth/login")
                    .expect(HTTPStatus.OK);
            });

            test("should return non-hidden offers", async () => {
                const res = await test_agent.get(`/offers/company/${test_company._id}`);
                expect(res.status).toBe(HTTPStatus.OK);

                const extractedData = res.body;
                expect(extractedData.map((offer) => offer._id).sort())
                    .toMatchObject(
                        test_offers.filter((offer) => offer.isHidden === false).map((offer) => offer._id).sort()
                    );
            });

            test("should return hidden company offers as admin", async () => {
                // Login with test_user_company
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);

                const res = await test_agent.get(`/offers/company/${test_company._id}`);
                expect(res.status).toBe(HTTPStatus.OK);

                const extractedData = res.body;
                expect(extractedData.map((offer) => offer._id).sort())
                    .toMatchObject(
                        test_offers.map((offer) => offer._id).sort()
                    );

                // Logout
                await test_agent
                    .del("/auth/login")
                    .expect(HTTPStatus.OK);
            });

            test("should return hidden company offers with god token", async () => {
                // Send request with god token
                const res = await test_agent
                    .get(`/offers/company/${test_company._id}`)
                    .send(withGodToken());

                expect(res.status).toBe(HTTPStatus.OK);

                const extractedData = res.body;
                expect(extractedData.map((offer) => offer._id).sort())
                    .toMatchObject(
                        test_offers.map((offer) => offer._id).sort()
                    );
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
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({ msg: ValidationReasons.OFFER_NOT_FOUND(id) });
            });
        });

        describe("Get offer by Id", () => {
            const test_offers = [{}, {}, {}, {}];

            const test_agent = agent();


            beforeAll(async () => {
                await Offer.deleteMany({});

                const createOffer = async (offer) => {
                    const { _id, owner, ownerName, ownerLogo } = await Offer.create({
                        ...offer,
                        owner: test_company._id.toString(),
                        ownerName: test_company.name,
                        ownerLogo: test_company.logo,
                    });
                    return {
                        ...offer,
                        owner: owner.toString(),
                        ownerName,
                        ownerLogo,
                        _id: _id.toString()
                    };
                };

                (await Promise.all(test_offers
                    .map((_, i) => createOffer({ ...generateTestOffer(), isHidden: i === 2 }))))
                    .forEach((elem, i) => {
                        test_offers[i] = elem;
                    });

                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);

                await test_agent
                    .post(`/offers/${test_offers[3]._id}/disable`)
                    .send({
                        "adminReason": "my_reason"
                    })
                    .expect(HTTPStatus.OK);

                await test_agent
                    .del("/auth/login")
                    .expect(HTTPStatus.OK);
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

            describe("adminReason", () => {

                afterEach(async () => {
                    await test_agent
                        .del("/auth/login")
                        .expect(HTTPStatus.OK);
                });

                test("should return adminReason if logged as admin", async () => {
                    await test_agent
                        .post("/auth/login")
                        .send(test_user_admin)
                        .expect(HTTPStatus.OK);

                    const res = await test_agent
                        .get(`/offers/${test_offers[3]._id}`);

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveProperty("adminReason", "my_reason");

                });

                test("should return adminReason if logged as god", async () => {

                    const res = await test_agent
                        .get(`/offers/${test_offers[3]._id}`)
                        .send(withGodToken());

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).toHaveProperty("adminReason", "my_reason");

                });

                test("should not return adminReason if logged as company", async () => {
                    await test_agent
                        .post("/auth/login")
                        .send(test_user_company)
                        .expect(HTTPStatus.OK);

                    const res = await test_agent
                        .get(`/offers/${test_offers[3]._id}`);

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body).not.toHaveProperty("adminReason");

                });
            });
        });
    });

    describe("POST /offers/edit/:offerId", () => {
        let createOffer,
            future_test_offer,
            valid_test_offer_1,
            valid_test_offer_2,
            disabled_test_offer;

        beforeAll(async () => {
            await Offer.deleteMany({});
            await test_agent.del("/auth/login");
            createOffer = async (offer) => {
                const { _id, owner, ownerName, ownerLogo, jobMinDuration, jobMaxDuration, createdAt } = await Offer.create({
                    ...offer,
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                });
                return {
                    ...offer,
                    owner: owner.toString(),
                    ownerName,
                    ownerLogo,
                    _id: _id.toString(),
                    jobMinDuration,
                    jobMaxDuration,
                    createdAt: createdAt.toISOString()
                };
            };

            future_test_offer = await createOffer(generateTestOffer({
                "publishDate": (new Date(Date.now() + (2 * DAY_TO_MS))).toISOString(),
                "publishEndDate": (new Date(Date.now() + (3 * DAY_TO_MS))).toISOString(),
                "jobMinDuration": 4,
                "jobMaxDuration": 5,
            }
            ));

            valid_test_offer_1 = await createOffer(generateTestOffer({
                "publishDate": (new Date(Date.now() + (2 * DAY_TO_MS))).toISOString(),
                "publishEndDate": (new Date(Date.now() + (3 * DAY_TO_MS))).toISOString(),
                "jobMinDuration": 4,
                "jobMaxDuration": 5,
            }
            ));

            valid_test_offer_2 = await createOffer(generateTestOffer({
                "publishDate": (new Date(Date.now() + (2 * DAY_TO_MS))).toISOString(),
                "publishEndDate": (new Date(Date.now() + (3 * DAY_TO_MS))).toISOString(),
                "jobMinDuration": 4,
                "jobMaxDuration": 5,
            }
            ));

            disabled_test_offer = await createOffer(
                generateTestOffer()
            );

            await (new OfferService()).disable(disabled_test_offer._id, OfferConstants.HiddenOfferReasons.ADMIN_BLOCK);
        });

        test("should fail not logged in", async () => {
            const res = await test_agent
                .post(`/offers/edit/${future_test_offer._id}`)
                .expect(HTTPStatus.UNAUTHORIZED);
            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });
        });

        describe("testing validations with god token", () => {
            test("should fail with invalid id", async () => {
                const res = await test_agent
                    .post("/offers/edit/not-a-valid-id")
                    .send(withGodToken())
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                expect(res.body.errors[0]).toHaveProperty("param", "offerId");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.OBJECT_ID);
            });

            test("should fail if offer does not exist", async () => {
                const _id = "111111111111111111111111";
                const res = await test_agent
                    .post(`/offers/edit/${_id}`)
                    .send(withGodToken())
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                expect(res.body.errors[0]).toHaveProperty("param", "offerId");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.OFFER_NOT_FOUND(_id));
            });


            test("should allow editing offer in the future", async () => {
                await test_agent
                    .post(`/offers/edit/${future_test_offer._id.toString()}`)
                    .send(withGodToken())
                    .expect(HTTPStatus.OK);
            });

            describe("testing edit dates in the past", () => {
                test("should fail if publishDate in the past", async () => {
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({ "publishDate": "2019-02-01" }))
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body.errors[0]).toHaveProperty("param", "publishDate");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.DATE_EXPIRED);
                });

                test("should fail if publishEndDate in the past", async () => {
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({ "publishEndDate": "2019-02-01" }))
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body.errors[0]).toHaveProperty("param", "publishEndDate");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.DATE_EXPIRED);
                });
            });

            describe("testing dates editing", () => {
                test("should fail if publishDate after offer publishEndDate", async () => {
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({
                            "publishDate":
                                (new Date(new Date(future_test_offer.publishEndDate).getTime() + DAY_TO_MS))
                                    .toISOString()
                        }))
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body.errors[0]).toHaveProperty("param", "publishDate");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.MUST_BE_BEFORE("publishEndDate"));
                });

                test("should fail if publishEndDate before offer publishDate", async () => {
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({
                            "publishEndDate":
                                (new Date(new Date(future_test_offer.publishDate).getTime() - DAY_TO_MS))
                                    .toISOString()
                        }))
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body.errors[0]).toHaveProperty("param", "publishEndDate");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.MUST_BE_AFTER("publishDate"));
                });

                test("should fail to edit if publishEndDate is after publishDate more than the time limit", async () => {
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({
                            "publishEndDate":
                                (new Date(
                                    new Date(future_test_offer.publishDate).getTime() +
                                    (MONTH_IN_MS * OFFER_MAX_LIFETIME_MONTHS) +
                                    DAY_TO_MS)
                                ).toISOString()
                        }))
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body.errors[0]).toHaveProperty("param", "publishEndDate");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.MUST_BE_BEFORE(
                        new Date(
                            new Date(future_test_offer.publishDate).getTime() +
                            (MONTH_IN_MS * OFFER_MAX_LIFETIME_MONTHS)
                        ).toISOString()
                    ));
                });

                test("should fail if sending invalid date combination in request", async () => {
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({
                            "publishEndDate": new Date(Date.now() + DAY_TO_MS).toISOString(),
                            "publishDate": new Date(Date.now() + (2 * DAY_TO_MS)).toISOString(),
                        }))
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body.errors[0]).toHaveProperty("param", "publishEndDate");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.MUST_BE_AFTER("publishDate"));
                });

                test("should edit if is after offer's publishEndDate", async () => {
                    const newDate = (new Date(new Date(future_test_offer.publishEndDate).getTime() - DAY_TO_MS));
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({ "publishDate": newDate.toISOString() }))
                        .expect(HTTPStatus.OK);
                    expect(res.body).toHaveProperty("publishDate", newDate.toISOString());
                });

                test("should edit if is after request's publishEndDate", async () => {
                    const newPublishDate = (new Date(new Date(future_test_offer.publishEndDate).getTime() + DAY_TO_MS));
                    const newPublishEndDate = (new Date(new Date(future_test_offer.publishEndDate).getTime() + (2 * DAY_TO_MS)));
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({
                            "publishDate": newPublishDate.toISOString(),
                            "publishEndDate": newPublishEndDate.toISOString()
                        }))
                        .expect(HTTPStatus.OK);
                    expect(res.body).toHaveProperty("publishDate", newPublishDate.toISOString());
                    expect(res.body).toHaveProperty("publishEndDate", newPublishEndDate.toISOString());
                });
            });

            describe("testing other validations", () => {

                test("should fail if company tries to edit offer disabled by admins", async () => {
                    await test_agent
                        .post("/auth/login")
                        .send(test_user_company)
                        .expect(HTTPStatus.OK);
                    const res = await test_agent
                        .post(`/offers/edit/${disabled_test_offer._id}`)
                        .expect(HTTPStatus.FORBIDDEN);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                    expect(res.body).toHaveProperty("errors");
                    expect(res.body.errors).toContainEqual({ msg: ValidationReasons.OFFER_BLOCKED_ADMIN });
                });

                test("should fail if minDuration bigger than offer's maxDuration", async () => {
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({ "jobMinDuration": future_test_offer.jobMaxDuration + 1 }))
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body.errors[0]).toHaveProperty("param", "jobMinDuration");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.MUST_BE_BEFORE("jobMaxDuration"));
                });
                test("should fail if maxDuration smaller than offer's minDuration", async () => {
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({ "jobMaxDuration": future_test_offer.jobMinDuration - 1 }))
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body.errors[0]).toHaveProperty("param", "jobMaxDuration");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.MUST_BE_AFTER("jobMinDuration"));
                });
                test("should fail if invalid combination of jobDuration in request", async () => {
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({
                            "jobMaxDuration": 11,
                            "jobMinDuration": 12
                        }))
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body.errors[0]).toHaveProperty("param", "jobMaxDuration");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.MUST_BE_AFTER("jobMinDuration"));
                });

                test("should fail if requirements is empty array", async () => {
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({ "requirements": [] }))
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body.errors[0]).toHaveProperty("param", "requirements");
                    expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.TOO_SHORT(1));
                });

                test("should edit if valid requirements", async () => {
                    await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({ "requirements": future_test_offer.requirements }))
                        .expect(HTTPStatus.OK);
                });

                test("Should fail to edit an offer if jobStartDate is specified as null", async () => {
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id.toString()}`)
                        .send(withGodToken({ jobStartDate: null }));

                    expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                    expect(res.body.errors).toHaveLength(1);
                    expect(res.body.errors[0]).toHaveProperty("param", "jobStartDate");
                    expect(res.body.errors[0]).toHaveProperty("location", "body");
                    expect(res.body.errors[0].msg).toEqual(ValidationReasons.DATE);
                });

                describe("Input validation", () => {

                    let offer;

                    beforeAll(async () => {

                        offer = await Offer.create(
                            generateTestOffer({
                                owner: test_company._id,
                                ownerName: test_company.name,
                                ownerLogo: test_company.logo,
                            })
                        );

                    });

                    const EndpointValidatorTester = ValidatorTester(
                        (params) => request().post(`/offers/edit/${offer._id}`).send(withGodToken(params)));
                    const BodyValidatorTester = EndpointValidatorTester("body");

                    describe("title", () => {
                        const FieldValidatorTester = BodyValidatorTester("title");
                        FieldValidatorTester.mustBeString();
                        FieldValidatorTester.hasMaxLength(OfferConstants.title.max_length);
                    });

                    describe("jobStartDate", () => {
                        const FieldValidatorTester = BodyValidatorTester("jobStartDate");
                        FieldValidatorTester.mustBeDate();
                    });

                    describe("description", () => {
                        const FieldValidatorTester = BodyValidatorTester("description");
                        FieldValidatorTester.mustBeString();
                        FieldValidatorTester.hasMaxLength(OfferConstants.description.max_length);
                    });

                    describe("contacts", () => {
                        const FieldValidatorTester = BodyValidatorTester("contacts");
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
                        FieldValidatorTester.mustBeString();
                        FieldValidatorTester.mustBeInArray(JobTypes);
                    });

                    describe("fields", () => {
                        const FieldValidatorTester = BodyValidatorTester("fields");
                        FieldValidatorTester.mustBeArrayBetween(FieldConstants.MIN_FIELDS, FieldConstants.MAX_FIELDS);
                        FieldValidatorTester.mustHaveValuesInRange(FieldConstants.FieldTypes, FieldConstants.MIN_FIELDS + 1);
                    });

                    describe("technologies", () => {
                        const FieldValidatorTester = BodyValidatorTester("technologies");
                        FieldValidatorTester.mustBeArrayBetween(TechnologyConstants.MIN_TECHNOLOGIES, TechnologyConstants.MAX_TECHNOLOGIES);
                        FieldValidatorTester.mustHaveValuesInRange(
                            TechnologyConstants.TechnologyTypes, TechnologyConstants.MIN_TECHNOLOGIES + 1
                        );
                    });

                    describe("location", () => {
                        const FieldValidatorTester = BodyValidatorTester("location");
                        FieldValidatorTester.mustBeString();
                    });

                    describe("isHidden", () => {
                        const FieldValidatorTester = BodyValidatorTester("isHidden");
                        FieldValidatorTester.mustBeBoolean();
                    });
                });
            });
        });

        describe("testing as admin without god token", () => {
            beforeAll(async () => {
                await test_agent.post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);
            });

            test("should edit as an admin", async () => {
                await test_agent.post(`/offers/edit/${future_test_offer._id}`)
                    .expect(HTTPStatus.OK);
            });
        });

        describe("Same 'publishDate' and 'publishEndDate'", () => {

            const dateNow = (new Date(Date.now() + (DAY_TO_MS * 5))).toISOString();
            const dateAfter = (new Date(Date.now() + (DAY_TO_MS * 10))).toISOString();
            let offer;

            beforeAll(async () => {

                // await Offer.deleteMany({});

                offer = await Offer.create(generateTestOffer({
                    publishDate: dateNow,
                    publishEndDate: dateNow,
                    owner: test_company._id,
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                }));
            });

            afterAll(async () => {
                await Offer.deleteMany({ offer });
            });

            test("should fail if 'publishDate' and 'publishEndDate' have the same value", async () => {

                const edits = {
                    publishDate: dateAfter,
                    publishEndDate: dateAfter,
                };

                const res = await request()
                    .post(`/offers/edit/${offer._id}`)
                    .send(withGodToken(edits));

                expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.MUST_BE_AFTER("publishDate"));
                expect(res.body.errors[0]).toHaveProperty("param", "publishEndDate");
                expect(res.body.errors[0]).toHaveProperty("location", "body");

            });
        });

        describe("testing as a company", () => {

            describe("testing as another company", () => {

                const test_user_company_2 = {
                    email: "company2@email.com",
                    password: "password123",
                };

                let test_company_2;

                beforeAll(async () => {
                    test_company_2 = await Company.create({
                        name: "test company",
                        bio: "a bio",
                        contacts: ["a contact"]
                    });
                    await Account.create({
                        email: test_user_company_2.email,
                        password: await hash(test_user_company.password),
                        company: test_company_2._id
                    });

                    await test_agent.post("/auth/login")
                        .send(test_user_company_2)
                        .expect(HTTPStatus.OK);
                });

                test("should fail if the company is not the owner", async () => {
                    const res = await test_agent
                        .post(`/offers/edit/${future_test_offer._id}`)
                        .expect(HTTPStatus.FORBIDDEN);
                    expect(res.body).toHaveProperty("or");
                    expect(res.body.or[0]).toHaveProperty("errors");
                    expect(res.body.or[0].errors).toContainEqual({ msg: ValidationReasons.NOT_OFFER_OWNER(future_test_offer._id) });
                });

            });

            describe("testing as offer's owner", () => {
                beforeAll(async () => {
                    await test_agent.post("/auth/login")
                        .send(test_user_company)
                        .expect(HTTPStatus.OK);

                });

                test("should edit title", async () => {
                    const edits = { "title": "This is a new title" };
                    const res = await test_agent.post(`/offers/edit/${valid_test_offer_1._id}`)
                        .send(edits)
                        .expect(HTTPStatus.OK);
                    expect(res.body).toMatchObject({
                        ...valid_test_offer_1,
                        ...edits
                    });
                });

                test("should edit several parameters", async () => {
                    const edits = {
                        "title": "This is a new title",
                        "description": "This is a new description",
                        "jobMinDuration": valid_test_offer_1.jobMinDuration - 1,
                        "location": "Porto",
                        "technologies": ["CSS"]
                    };
                    const res = await test_agent.post(`/offers/edit/${valid_test_offer_2._id}`)
                        .send(edits)
                        .expect(HTTPStatus.OK);
                    expect(res.body).toMatchObject({
                        ...valid_test_offer_2,
                        ...edits
                    });
                });
            });

        });

        describe("Blocked company", () => {

            let blocked_test_company, test_offer;
            beforeAll(async () => {
                blocked_test_company = await Company.create({
                    name: "blocked test company",
                    bio: "a bio",
                    contacts: ["a contact"],
                    isBlocked: true,
                    hasFinishedRegistration: true,
                    logo: "http://awebsite.com/alogo.jpg"
                });
                test_offer = await Offer.create(
                    generateTestOffer({
                        owner: blocked_test_company._id,
                        ownerName: blocked_test_company.name,
                        ownerLogo: blocked_test_company.logo,
                    })
                );
            });

            test("should fail to edit offer if company blocked", async () => {
                const res = await request()
                    .post(`/offers/edit/${test_offer.id}`)
                    .send(withGodToken());

                expect(res.status).toBe(HTTPStatus.FORBIDDEN);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty(
                    "msg", ValidationReasons.COMPANY_BLOCKED);
            });
        });

        describe("testing editing offer publish period exceeding concurrent offers", () => {

            let test_offer_current, test_offer_before, test_offer_after;

            const now = Date.now();

            beforeAll(async () => {

                await Offer.deleteMany({});

                test_offer_before = await Offer.create({
                    ...generateTestOffer({
                        publishDate: (new Date(now + (3 * DAY_TO_MS))).toISOString(),
                        publishEndDate: (new Date(now + (7 * DAY_TO_MS))).toISOString() }),
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                });

                for (let i = 0; i < CompanyConstants.offers.max_concurrent - 1; i++)
                    await Offer.create({
                        ...generateTestOffer({
                            publishDate: (new Date(now + (8 * DAY_TO_MS))).toISOString(),
                            publishEndDate: (new Date(now + (12 * DAY_TO_MS))).toISOString() }),
                        owner: test_company._id.toString(),
                        ownerName: test_company.name,
                        ownerLogo: test_company.logo,
                    });

                test_offer_current = await Offer.create({
                    ...generateTestOffer({
                        publishDate: (new Date(now + (8 * DAY_TO_MS))).toISOString(),
                        publishEndDate: (new Date(now + (12 * DAY_TO_MS))).toISOString() }),
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                });

                test_offer_after = await Offer.create({
                    ...generateTestOffer({
                        publishDate: (new Date(now + (13 * DAY_TO_MS))).toISOString(),
                        publishEndDate: (new Date(now + (17 * DAY_TO_MS))).toISOString() }),
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                });

                await test_agent.post("/auth/login")
                    .send(test_user_company)
                    .expect(HTTPStatus.OK);

            });

            afterAll(async () => {
                await Offer.deleteMany({});
                await test_agent.del("/auth/login").expect(HTTPStatus.OK);
            });

            test("should fail when editing publishEndDate to timeperiod with max concurrent offers", async () => {
                const edits = {
                    publishEndDate: new Date(new Date(test_offer_before.publishEndDate).getTime() + (1 * DAY_TO_MS)).toISOString()
                };

                const res = await test_agent.post(`/offers/edit/${test_offer_before._id}`)
                    .send(edits)
                    .expect(HTTPStatus.CONFLICT);

                expect(res.status).toEqual(HTTPStatus.CONFLICT);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual(
                    { msg: ValidationReasons.MAX_CONCURRENT_OFFERS_EXCEEDED(CompanyConstants.offers.max_concurrent) });
            });

            test("should fail when editing publishDate to timeperiod with max concurrent offers", async () => {
                const edits = {
                    publishDate: new Date(new Date(test_offer_after.publishDate).getTime() - (1 * DAY_TO_MS)).toISOString()
                };
                const res = await test_agent.post(`/offers/edit/${test_offer_after._id}`)
                    .send(edits)
                    .expect(HTTPStatus.CONFLICT);

                expect(res.status).toEqual(HTTPStatus.CONFLICT);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual(
                    { msg: ValidationReasons.MAX_CONCURRENT_OFFERS_EXCEEDED(CompanyConstants.offers.max_concurrent) });
            });

            test("should not fail when editing into same publishDate and publishEndDate", async () => {
                const edits = {
                    publishDate: test_offer_current.publishDate,
                    publishEndDate: test_offer_current.publishEndDate
                };
                await test_agent.post(`/offers/edit/${test_offer_current._id}`)
                    .send(edits)
                    .expect(HTTPStatus.OK);
            });

            test("should not fail when editing publishDate of one of the concurrent offers into the 'concurrent' time period", async () => {
                const edits = {
                    publishDate: new Date(new Date(test_offer_current.publishDate).getTime() + (1 * DAY_TO_MS)).toISOString()
                };
                await test_agent.post(`/offers/edit/${test_offer_current._id}`)
                    .send(edits)
                    .expect(HTTPStatus.OK);
            });

            test("should not fail when editing publishEndDate of one of the concurrent offers into the 'concurrent' time period",
                async () => {
                    const edits = {
                        publishEndDate: new Date(new Date(test_offer_current.publishEndDate).getTime() - (1 * DAY_TO_MS)).toISOString()
                    };
                    await test_agent.post(`/offers/edit/${test_offer_current._id}`)
                        .send(edits)
                        .expect(HTTPStatus.OK);
                });
        });

        describe("Disabled company", () => {

            let disabled_company, test_offer;

            const disabled_company_user = {
                email: "disabled_company2@email.com",
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

                test_offer = await Offer.create(
                    generateTestOffer({
                        owner: disabled_company._id,
                        ownerName: disabled_company.name,
                        ownerLogo: disabled_company.logo,
                    })
                );
            });

            test("Should not edit offer if company is disabled, logged in as same company", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(disabled_company_user)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .post(`/offers/edit/${test_offer._id}`);

                expect(res.status).toBe(HTTPStatus.FORBIDDEN);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({ msg: ValidationReasons.COMPANY_DISABLED });
            });
        });
    });

    describe("POST /offers/:offerId/disable", () => {
        let test_offer, test_offer_2, hidden_default_test_offer, hidden_user_test_offer, email_test_offer;
        beforeAll(async () => {
            test_offer = await Offer.create({
                ...generateTestOffer({
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                }),
            });

            test_offer_2 = await Offer.create({
                ...generateTestOffer({
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                }),
            });

            hidden_default_test_offer = await Offer.create({
                ...generateTestOffer({
                    isHidden: true,
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                }),
            });

            hidden_user_test_offer = await Offer.create({
                ...generateTestOffer(),
                owner: test_company._id.toString(),
                ownerName: test_company.name,
                ownerLogo: test_company.logo,
            });

            email_test_offer = await Offer.create({
                ...generateTestOffer(),
                owner: test_company._id.toString(),
                ownerName: test_company.name,
                ownerLogo: test_company.logo,
            });

            await (new OfferService()).disable(hidden_user_test_offer._id, OfferConstants.HiddenOfferReasons.COMPANY_REQUEST);
        });

        test("should fail to disable if no admin reason sent", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .post(`/offers/${test_offer._id}/disable`)
                .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body.errors).toHaveLength(1);
            expect(res.body.errors[0]).toHaveProperty("param", "adminReason");
            expect(res.body.errors[0]).toHaveProperty("location", "body");
            expect(res.body.errors[0].msg).toEqual(ValidationReasons.REQUIRED);
        });

        test("should fail to disable if admin reason not string", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .post(`/offers/${test_offer._id}/disable`)
                .send({
                    "adminReason": 5
                })
                .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body.errors).toHaveLength(1);
            expect(res.body.errors[0]).toHaveProperty("param", "adminReason");
            expect(res.body.errors[0]).toHaveProperty("location", "body");
            expect(res.body.errors[0].msg).toEqual(ValidationReasons.STRING);
        });

        test("should fail to disable if not logged in", async () => {
            await test_agent
                .del("/auth/login");

            const res = await test_agent
                .post(`/offers/${test_offer._id}/disable`)
                .send({
                    "adminReason": "Sample admin response"
                })
                .expect(HTTPStatus.UNAUTHORIZED);
            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });
        });

        test("should fail to disable offer if logged in as company", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_company)
                .expect(HTTPStatus.OK);
            const res = await test_agent
                .post(`/offers/${test_offer._id}/disable`)
                .send({
                    "adminReason": "Sample admin response"
                })
                .expect(HTTPStatus.UNAUTHORIZED);
            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });
        });

        test("should allow disabing offer if logged in as god", async () => {
            await test_agent
                .del("/auth/login");
            const res = await test_agent
                .post(`/offers/${test_offer_2._id}/disable`)
                .send(withGodToken({
                    "adminReason": "Sample admin response"
                }));
            expect(res.body).toHaveProperty("hiddenReason", OfferConstants.HiddenOfferReasons.ADMIN_BLOCK);
            expect(res.body).toHaveProperty("isHidden", true);
            expect(res.body).toHaveProperty("adminReason", "Sample admin response");
        });

        test("should allow disabing offer if logged in as admin", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);
            const res = await test_agent
                .post(`/offers/${test_offer._id}/disable`)
                .send({
                    "adminReason": "Sample admin response"
                });
            expect(res.body).toHaveProperty("hiddenReason", OfferConstants.HiddenOfferReasons.ADMIN_BLOCK);
            expect(res.body).toHaveProperty("isHidden", true);
        });

        test("should fail if offer already disabled", async () => {
            const res = await test_agent
                .post(`/offers/${test_offer._id}/disable`)
                .send({
                    "adminReason": "Sample admin response"
                })
                .expect(HTTPStatus.FORBIDDEN);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.OFFER_HIDDEN });
        });

        test("should allow disabling if offer hidden by default", async () => {
            const res = await test_agent
                .post(`/offers/${hidden_default_test_offer._id}/disable`)
                .send({
                    "adminReason": "Sample admin response"
                })
                .expect(HTTPStatus.OK);
            expect(res.body).toHaveProperty("hiddenReason", OfferConstants.HiddenOfferReasons.ADMIN_BLOCK);
            expect(res.body).toHaveProperty("isHidden", true);
            expect(res.body).toHaveProperty("adminReason", "Sample admin response");
        });

        test("should allow disabling if offer hidden by company/admin", async () => {
            const res = await test_agent
                .post(`/offers/${hidden_user_test_offer._id}/disable`)
                .send({
                    "adminReason": "Sample admin response"
                });
            expect(res.body).toHaveProperty("hiddenReason", OfferConstants.HiddenOfferReasons.ADMIN_BLOCK);
            expect(res.body).toHaveProperty("isHidden", true);
            expect(res.body).toHaveProperty("adminReason", "Sample admin response");
        });

        test("should send an email to the company user when offer is disabled", async () => {
            await test_agent
                .del("/auth/login");
            const res = await test_agent
                .post(`/offers/${email_test_offer._id}/disable`)
                .send(withGodToken({
                    "adminReason": "Sample admin response"
                }));

            expect(res.status).toBe(HTTPStatus.OK);

            const emailOptions = OFFER_DISABLED_NOTIFICATION(
                email_test_offer.ownerName,
                email_test_offer.title,
                email_test_offer.description
            );

            expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: emailOptions.subject,
                to: test_user_company.email,
                template: emailOptions.template,
                context: emailOptions.context,
            }));
        });

        describe("Disabled companies", () => {
            let disabled_test_company, test_offer;

            const disabled_test_user = {
                email: "disabled_user@email.com",
                password: "password123"
            };

            beforeAll(async () => {
                await Offer.deleteMany({});

                disabled_test_company = await Company.create({
                    name: "disabled-company",
                    isDisabled: true,
                    hasFinishedRegistration: true,
                    logo: "http://awebsite.com/alogo.jpg",
                });

                await Account.create({
                    email: disabled_test_user.email,
                    password: await hash(disabled_test_user.password),
                    company: disabled_test_company._id
                });

                test_offer = await Offer.create({
                    ...generateTestOffer({
                        owner: disabled_test_company._id.toString(),
                        ownerName: disabled_test_company.name,
                        ownerLogo: disabled_test_company.logo,
                    }),
                });
            });

            afterAll(async () => {
                await Offer.deleteMany({ test_offer });
                await Company.deleteMany({ disabled_test_company });
            });

            test("Should fail to disable offer is company is already disabled", async () => {

                const res = await test_agent
                    .post(`/offers/${test_offer._id}/disable`)
                    .send(withGodToken({ adminReason: "sample-admin-reason" }));

                expect(res.status).toBe(HTTPStatus.FORBIDDEN);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({ msg: ValidationReasons.COMPANY_DISABLED });
            });
        });
    });

    describe("POST /offers/:offerId/hide", () => {
        const test_user_company_2 = {
            email: "company3@email.com",
            password: "password123",
        };
        let test_company_2;
        let test_offer_1, test_offer_2, hidden_default_test_offer, disabled_test_offer;
        beforeAll(async () => {
            test_company_2 = await Company.create({
                name: "test company",
                bio: "a bio",
                contacts: ["a contact"],
                logo: "http://awebsite.com/alogo.jpg",
            });
            await Account.create({
                email: test_user_company_2.email,
                password: await hash(test_user_company.password),
                company: test_company_2._id
            });

            test_offer_1 = await Offer.create({
                ...generateTestOffer({
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                }),
            });

            test_offer_2 = await Offer.create({
                ...generateTestOffer({
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                }),
            });


            hidden_default_test_offer = await Offer.create({
                ...generateTestOffer({
                    isHidden: true,
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                }),
            });

            disabled_test_offer = await Offer.create({
                ...generateTestOffer({
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                }),
            });

            await (new OfferService()).disable(disabled_test_offer._id, OfferConstants.HiddenOfferReasons.ADMIN_BLOCK);
        });

        test("should fail to hide if not logged in", async () => {
            await test_agent
                .del("/auth/login");

            const res = await test_agent
                .post(`/offers/${test_offer_1._id}/hide`)
                .expect(HTTPStatus.UNAUTHORIZED);
            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });
        });

        test("should hide successfully if admin", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .post(`/offers/${test_offer_1._id}/hide`)
                .expect(HTTPStatus.OK);
            expect(res.body).toHaveProperty("hiddenReason", OfferConstants.HiddenOfferReasons.COMPANY_REQUEST);
            expect(res.body).toHaveProperty("isHidden", true);
        });

        test("should fail to hide if not logged in as owner company", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .post(`/offers/${test_offer_2._id}/hide`)
                .expect(HTTPStatus.FORBIDDEN);
            expect(res.body).toHaveProperty("or");
            expect(res.body.or[0]).toHaveProperty("errors");
            expect(res.body.or[0].errors).toContainEqual({ msg: ValidationReasons.NOT_OFFER_OWNER(test_offer_2._id) });
        });

        test("should hide successfully if logged in as the owner company", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_company)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .post(`/offers/${test_offer_2._id}/hide`)
                .expect(HTTPStatus.OK);
            expect(res.body).toHaveProperty("hiddenReason", OfferConstants.HiddenOfferReasons.COMPANY_REQUEST);
            expect(res.body).toHaveProperty("isHidden", true);
        });

        test("should fail to hide if already hidden offer by default", async () => {
            const res = await test_agent
                .post(`/offers/${hidden_default_test_offer._id}/hide`)
                .expect(HTTPStatus.FORBIDDEN);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.OFFER_HIDDEN });
        });

        test("should fail if already hidden offer by user", async () => {
            const res = await test_agent
                .post(`/offers/${test_offer_1._id}/hide`)
                .expect(HTTPStatus.FORBIDDEN);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.OFFER_HIDDEN });
        });

        test("should fail to hide if already disabled by admin", async () => {
            const res = await test_agent
                .post(`/offers/${disabled_test_offer._id}/hide`)
                .expect(HTTPStatus.FORBIDDEN);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.OFFER_HIDDEN });
        });

        describe("Disabled company", () => {

            let disabled_company, test_offer;

            const disabled_company_user = {
                email: "disabled_company3@email.com",
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

                test_offer = await Offer.create(
                    generateTestOffer({
                        owner: disabled_company._id,
                        ownerName: disabled_company.name,
                        ownerLogo: disabled_company.logo,
                    })
                );
            });

            test("Should not hide offer if company is disabled, logged in as same company", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(disabled_company_user)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .post(`/offers/${test_offer._id}/hide`);

                expect(res.status).toBe(HTTPStatus.FORBIDDEN);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({ msg: ValidationReasons.COMPANY_DISABLED });
            });
        });
    });

    describe("PUT /offers/:offerId/enable", () => {

        let test_offer,
            hidden_user_test_offer,
            hidden_default_test_offer,
            disabled_test_offer;

        beforeAll(async () => {

            test_offer = await Offer.create({
                ...generateTestOffer({
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                }),
            });

            hidden_default_test_offer = await Offer.create({
                ...generateTestOffer({
                    isHidden: true,
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                }),
            });

            hidden_user_test_offer = await Offer.create({
                ...generateTestOffer({
                    isHidden: true,
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                }),
            });

            await (new OfferService()).disable(hidden_user_test_offer._id, OfferConstants.HiddenOfferReasons.COMPANY_REQUEST);

            disabled_test_offer = await Offer.create({
                ...generateTestOffer({
                    "publishDate": (new Date(Date.now() + (10 * DAY_TO_MS))).toISOString(),
                    "publishEndDate": (new Date(Date.now() + (20 * DAY_TO_MS))).toISOString(),
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                }),
            });

            await (new OfferService()).disable(disabled_test_offer._id, OfferConstants.HiddenOfferReasons.ADMIN_BLOCK);
        });

        test("should fail to enable if not logged in", async () => {
            await test_agent
                .del("/auth/login");

            const res = await test_agent
                .put(`/offers/${test_offer._id}/enable`)
                .expect(HTTPStatus.UNAUTHORIZED);
            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });
        });

        test("should enable successfully if admin and offer hidden by default as an admin", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/offers/${hidden_default_test_offer._id}/enable`)
                .expect(HTTPStatus.OK);
            expect(res.body).toHaveProperty("isHidden", false);
        });

        test("should enable successfully if logged in company and hidden by user/admin", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_company)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/offers/${hidden_user_test_offer._id}/enable`)
                .expect(HTTPStatus.OK);
            expect(res.body).toHaveProperty("isHidden", false);
        });


        test("should fail to enable if offer disabled by admins logged in as a company", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_company)
                .expect(HTTPStatus.OK);
            const res = await test_agent
                .put(`/offers/${disabled_test_offer._id}/enable`)
                .expect(HTTPStatus.FORBIDDEN);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.OFFER_BLOCKED_ADMIN });
        });

        describe("testing concurrent offers", () => {
            const test_offers = Array(CompanyConstants.offers.max_concurrent)
                .fill(generateTestOffer());

            let test_offer;
            beforeAll(async () => {
                await Offer.deleteMany({});

                test_offers.forEach((offer) => {
                    offer.owner = test_company._id;
                    offer.ownerName = test_company.name;
                    offer.ownerLogo = test_company.logo;
                });

                test_offer = await Offer.create({
                    ...generateTestOffer({
                        isHidden: true,
                        owner: test_company._id,
                        ownerName: test_company.name,
                        ownerLogo: test_company.logo,
                    }),
                });

                await Offer.create(test_offers);
            });

            test("should fail to enable if max concurrent offers reached", async () => {
                const res = await test_agent
                    .put(`/offers/${test_offer._id}/enable`)
                    .expect(HTTPStatus.CONFLICT);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors)
                    .toContainEqual({ msg: ValidationReasons.MAX_CONCURRENT_OFFERS_EXCEEDED(CompanyConstants.offers.max_concurrent) });
            });
        });

        describe("Blocked company", () => {

            let blocked_test_company, test_offer;
            beforeAll(async () => {
                blocked_test_company = await Company.create({
                    name: "blocked test company",
                    bio: "a bio",
                    contacts: ["a contact"],
                    isBlocked: true,
                    hasFinishedRegistration: true,
                    logo: "http://awebsite.com/alogo.jpg"
                });
                test_offer = await Offer.create(
                    generateTestOffer({
                        owner: blocked_test_company._id,
                        ownerName: blocked_test_company.name,
                        ownerLogo: blocked_test_company.logo,
                        hiddenReason: OfferConstants.HiddenOfferReasons.ADMIN_BLOCK,
                        isHidden: true
                    })
                );
            });

            test("should fail to enable offer if company blocked", async () => {
                const res = await request()
                    .put(`/offers/${test_offer.id}/enable`)
                    .send(withGodToken());

                expect(res.status).toBe(HTTPStatus.FORBIDDEN);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty(
                    "msg", ValidationReasons.COMPANY_BLOCKED);
            });
        });

        describe("Disabled company", () => {

            let disabled_company, test_offer;

            const disabled_company_user = {
                email: "disabled_company4@email.com",
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

                test_offer = await Offer.create(
                    generateTestOffer({
                        owner: disabled_company._id,
                        ownerName: disabled_company.name,
                        ownerLogo: disabled_company.logo,
                        hiddenReason: OfferConstants.HiddenOfferReasons.COMPANY_REQUEST,
                        isHidden: true
                    })
                );
            });

            test("Should not enable offer if company is disabled, logged in as same company", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(disabled_company_user)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/offers/${test_offer._id}/enable`);

                expect(res.status).toBe(HTTPStatus.FORBIDDEN);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({ msg: ValidationReasons.COMPANY_DISABLED });
            });

            test("Should not enable offer if company is disabled, sending god token", async () => {
                const res = await test_agent
                    .put(`/offers/${test_offer._id}/enable`)
                    .send(withGodToken());

                expect(res.status).toBe(HTTPStatus.FORBIDDEN);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({ msg: ValidationReasons.COMPANY_DISABLED });
            });

            test("Should not enable offer if company is disabled, logged in as admin", async () => {

                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/offers/${test_offer._id}/enable`);

                expect(res.status).toBe(HTTPStatus.FORBIDDEN);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({ msg: ValidationReasons.COMPANY_DISABLED });
            });
        });
    });
});
