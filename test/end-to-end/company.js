import config from "../../src/config/env";
import { StatusCodes as HTTPStatus } from "http-status-codes";
import Account from "../../src/models/Account";
import Company from "../../src/models/Company";
import Offer from "../../src/models/Offer";
import hash from "../../src/lib/passwordHashing";
import ValidationReasons from "../../src/api/middleware/validators/validationReasons";
import CompanyConstants from "../../src/models/constants/Company";
import OfferConstants from "../../src/models/constants/Offer";
import withGodToken from "../utils/GodToken";
import { DAY_TO_MS } from "../utils/TimeConstants";
import fs from "fs";
import path from "path";
import { ErrorTypes } from "../../src/api/middleware/errorHandler";
import EmailService from "../../src/lib/emailService";
import { COMPANY_UNBLOCKED_NOTIFICATION,
    COMPANY_BLOCKED_NOTIFICATION,
    COMPANY_ENABLED_NOTIFICATION,
    COMPANY_DISABLED_NOTIFICATION,
    COMPANY_DELETED_NOTIFICATION } from "../../src/email-templates/companyManagement";
import { MAX_FILE_SIZE_MB } from "../../src/api/middleware/utils";
import { fileURLToPath } from "url";

const getCompanies = async (options) =>
    [...(await Company.find(options)
        .sort({ name: "asc" }) // sort them to match what gets returned by the service
        .exec())]
        .map((company) => ({
            ...company.toObject(),
            _id: company._id.toString(),
        }));

describe("Company endpoint", () => {

    const generateTestOffer = (params) => ({
        title: "Test Offer",
        publishDate: (new Date()).toISOString(),
        publishEndDate: (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
        description: "For Testing Purposes",
        contacts: ["geral@niaefeup.pt", "229417766"],
        jobType: "SUMMER INTERNSHIP",
        jobMinDuration: 1,
        jobMaxDuration: 6,
        fields: ["DEVOPS", "BACKEND", "OTHER"],
        technologies: ["React", "CSS"],
        location: "Testing Street, Test City, 123",
        isHidden: false,
        requirements: ["The candidate must be tested", "Fluent in testJS"],
        ...params,
    });

    const generateTestCompany = (params) => ({
        name: "Big Company",
        bio: "Big Company Bio",
        logo: "http://awebsite.com/alogo.jpg",
        contacts: ["112", "122"],
        hasFinishedRegistration: true,
        ...params,
    });


    describe("GET /company", () => {
        beforeAll(async () => {
            await Company.deleteMany({});
        });

        test("should return an empty array", async () => {
            const res = await request()
                .get("/company");
            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.companies).toEqual([]);
            expect(res.body.totalDocCount).toEqual(0);
        });

        test("should return the newly created company", async () => {
            await Company.create({ name: "Company" });
            const res = await request()
                .get("/company");
            const companies = await getCompanies({});
            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.companies).toEqual(companies);
            expect(res.body.totalDocCount).toEqual(1);
        });

        test("should not return blocked created company if not logged in", async () => {
            await Company.deleteMany({});
            await Company.create({ name: "Company", isBlocked: true });
            const res = await request()
                .get("/company");
            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.companies).toEqual([]);
            expect(res.body.totalDocCount).toEqual(0);
        });


        describe("With Auth", () => {
            const test_agent = agent();

            const test_user_admin = {
                email: "admin@email.com",
                password: "password123",
            };

            beforeEach(async () => {
                await Company.deleteMany({});
                await Account.deleteMany({});
                await Account.create({
                    email: test_user_admin.email,
                    password: await hash(test_user_admin.password),
                    isAdmin: true
                });
            });

            test("should return blocked created company logged in as admin", async () => {
                await Company.create({ name: "Company", isBlocked: true });
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(200);

                const res = await test_agent
                    .get("/company");
                const companies = await getCompanies({});
                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body.companies).toEqual(companies);
                expect(res.body.totalDocCount).toEqual(1);
            });

        });

        describe("Disabled companies", () => {
            let test_company, disabled_test_company;
            const test_user_admin = {
                email: "admin@email.com",
                password: "password123",
            };
            const test_user_company = {
                email: "company@email.com",
                password: "password123",
            };

            const test_agent = agent();

            beforeAll(async () => {

                await test_agent
                    .delete("/auth/login")
                    .expect(HTTPStatus.OK);

                await Company.deleteMany({});

                test_company = {
                    name: "test-company"
                };

                disabled_test_company = {
                    name: "disabled-test-company",
                    isDisabled: true
                };

                const companies = await Company.create([test_company, disabled_test_company]);

                await Account.deleteMany({});
                await Account.create({
                    email: test_user_admin.email,
                    password: await hash(test_user_admin.password),
                    isAdmin: true
                });
                await Account.create({
                    email: test_user_company.email,
                    password: await hash(test_user_company.password),
                    company: companies[0]._id
                });
            });

            afterEach(async () => {
                await test_agent
                    .delete("/auth/login")
                    .expect(HTTPStatus.OK);
            });

            test("should return both companies if god token is sent", async () => {

                const res = await test_agent
                    .get("/company")
                    .send(withGodToken());

                const companies = await getCompanies({});

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body.companies).toEqual(companies);
                expect(res.body.totalDocCount).toEqual(2);

            });

            test("should return both companies if logged as admin", async () => {

                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .get("/company");

                const companies = await getCompanies({});
                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body.companies).toEqual(companies);
                expect(res.body.totalDocCount).toEqual(2);

            });

            test("should return only the enabled company if logged as unprivileged user", async () => {

                await test_agent
                    .post("/auth/login")
                    .send(test_user_company)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .get("/company");

                const companies = await getCompanies({ isDisabled: { $ne: true } });
                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body.companies).toEqual(companies);
                expect(res.body.totalDocCount).toEqual(1);
            });

            test("should return only the enabled company if not logged", async () => {

                const res = await test_agent
                    .get("/company");

                const companies = await getCompanies({ isDisabled: { $ne: true } });
                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body.companies).toEqual(companies);
                expect(res.body.totalDocCount).toEqual(1);
            });
        });
    });

    describe("GET /company/:companyId", () => {
        let test_company_without_offers,
            test_company_with_offers_below_limit,
            test_company_with_offers_at_limit,
            test_company_with_offers_above_limit,
            test_company_with_hidden_offer,
            test_offer_hidden,
            test_company_disabled,
            test_company_blocked,
            test_company_with_unfinished_registration;

        const test_user_with_unfinished_registration = {
            email: "unfinished@email.com",
            password: "password123",
        };
        const test_user_with_hidden_offer = {
            email: "hidden@email.com",
            password: "password123",
        };
        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
            isAdmin: true,
        };
        const test_user_disabled_company = {
            email: "disabled@email.com",
            password: "password123",
        };
        const test_user_blocked_company = {
            email: "blocked@email.com",
            password: "password123",
        };
        const test_company_data = {
            name: "test-company",
            hasFinishedRegistration: true,
            logo: "http://awebsite.com/alogo.jpg",
        };

        const test_agent = agent();

        const createTestOffers = (length, company) =>
            Promise.all(
                Array.from({ length }, () =>
                    Offer.create(
                        generateTestOffer({
                            publishDate: new Date(
                                Date.now() - DAY_TO_MS
                            ).toISOString(),
                            publishEndDate: new Date(
                                Date.now() + DAY_TO_MS
                            ).toISOString(),
                            owner: company._id,
                            ownerName: company.name,
                            ownerLogo: company.logo,
                        })
                    )
                )
            );

        beforeAll(async () => {
            await Company.deleteMany({});

            [
                test_company_without_offers,
                test_company_with_offers_below_limit,
                test_company_with_offers_at_limit,
                test_company_with_offers_above_limit,
                test_company_with_hidden_offer,
                test_company_disabled,
                test_company_blocked,
                test_company_with_unfinished_registration,
            ] = await Company.create([
                test_company_data,
                test_company_data,
                test_company_data,
                test_company_data,
                test_company_data,
                { ...test_company_data, isDisabled: true },
                { ...test_company_data, isBlocked: true },
                { ...test_company_data, hasFinishedRegistration: false },
            ]);

            await Account.deleteMany({});

            await Promise.all([
                Account.create({
                    email: test_user_admin.email,
                    password: await hash(test_user_admin.password),
                    isAdmin: true,
                }),
                Account.create({
                    email: test_user_with_unfinished_registration.email,
                    password: await hash(
                        test_user_with_unfinished_registration.password
                    ),
                    company: test_company_with_unfinished_registration._id,
                }),
                Account.create({
                    email: test_user_with_hidden_offer.email,
                    password: await hash(test_user_with_hidden_offer.password),
                    company: test_company_with_hidden_offer._id,
                }),
                Account.create({
                    email: test_user_disabled_company.email,
                    password: await hash(test_user_disabled_company.password),
                    company: test_company_disabled._id,
                }),
                Account.create({
                    email: test_user_blocked_company.email,
                    password: await hash(test_user_blocked_company.password),
                    company: test_company_blocked._id,
                }),
            ]);

            test_offer_hidden = await Offer.create(
                generateTestOffer({
                    isHidden: true,
                    owner: test_company_with_hidden_offer._id.toString(),
                    ownerName: test_company_with_hidden_offer.name,
                    ownerLogo: test_company_with_hidden_offer.logo,
                })
            );
        });

        afterEach(async () => {
            await test_agent.delete("/auth/login").expect(HTTPStatus.OK);
        });

        describe("Without Auth", () => {
            test("should fail if invalid id", async () => {
                const res = await test_agent
                    .get("/company/123")
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty(
                    "error_code",
                    ErrorTypes.VALIDATION_ERROR
                );
                expect(res.body).toHaveProperty(
                    "errors",
                    expect.arrayContaining([
                        expect.objectContaining({
                            param: "companyId",
                            msg: ValidationReasons.OBJECT_ID,
                        }),
                    ])
                );
            });

            test("should fail if company does not exist", async () => {
                const id = "111111111111111111111111";
                const res = await test_agent
                    .get(`/company/${id}`)
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty(
                    "error_code",
                    ErrorTypes.VALIDATION_ERROR
                );
                expect(res.body).toHaveProperty(
                    "errors",
                    expect.arrayContaining([
                        expect.objectContaining({
                            param: "companyId",
                            msg: ValidationReasons.COMPANY_NOT_FOUND(id),
                        }),
                    ])
                );
            });

            test("should succeed when the company has no offers", async () => {
                const res = await test_agent
                    .get(`/company/${test_company_without_offers.id}`)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("offers", []);
                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_without_offers._id.toString()
                );
            });

            test("should return all offers when below limit", async () => {
                const offers = await createTestOffers(
                    CompanyConstants.offers.max_profile_visible - 1,
                    test_company_with_offers_below_limit
                );

                const res = await test_agent
                    .get(`/company/${test_company_with_offers_below_limit._id}`)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("offers");
                expect(res.body.offers).toHaveLength(
                    CompanyConstants.offers.max_profile_visible - 1
                );
                expect(res.body.offers.map((x) => x._id).sort()).toEqual(
                    offers.map((x) => x._id.toString()).sort()
                );

                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_with_offers_below_limit._id.toString()
                );
            });

            test("should return all offers when at limit", async () => {
                const offers = await createTestOffers(
                    CompanyConstants.offers.max_profile_visible,
                    test_company_with_offers_at_limit
                );

                const res = await test_agent
                    .get(`/company/${test_company_with_offers_at_limit._id}`)
                    .expect(HTTPStatus.OK);
                expect(res.body).toHaveProperty("offers");
                expect(res.body.offers).toHaveLength(
                    CompanyConstants.offers.max_profile_visible
                );
                expect(res.body.offers.map((x) => x._id).sort()).toEqual(
                    offers.map((x) => x._id.toString()).sort()
                );

                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_with_offers_at_limit._id.toString()
                );
            });

            test("should limit number of offers", async () => {
                const offers = await createTestOffers(
                    CompanyConstants.offers.max_profile_visible + 10,
                    test_company_with_offers_above_limit
                );

                const res = await test_agent
                    .get(`/company/${test_company_with_offers_above_limit._id}`)
                    .expect(HTTPStatus.OK);
                expect(res.body).toHaveProperty("offers");
                expect(res.body.offers).toHaveLength(
                    CompanyConstants.offers.max_profile_visible
                );
                expect(offers.map((x) => x._id.toString())).toEqual(
                    expect.arrayContaining(res.body.offers.map((x) => x._id))
                );

                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_with_offers_above_limit._id.toString()
                );
            });

            test("should not return hidden offers", async () => {
                const res = await test_agent
                    .get(`/company/${test_company_with_hidden_offer._id}`)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("offers", []);
                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_with_hidden_offer._id.toString()
                );
            });

            test("should fail if company is disabled", async () => {
                const res = await test_agent
                    .get(`/company/${test_company_disabled._id}`)
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty(
                    "error_code",
                    ErrorTypes.VALIDATION_ERROR
                );
                expect(res.body).toHaveProperty(
                    "errors",
                    expect.arrayContaining([
                        expect.objectContaining({
                            param: "companyId",
                            msg: ValidationReasons.COMPANY_NOT_FOUND(
                                test_company_disabled._id
                            ),
                        }),
                    ])
                );
            });

            test("should fail if company is blocked", async () => {
                const res = await test_agent
                    .get(`/company/${test_company_blocked._id}`)
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty(
                    "error_code",
                    ErrorTypes.VALIDATION_ERROR
                );
                expect(res.body).toHaveProperty(
                    "errors",
                    expect.arrayContaining([
                        expect.objectContaining({
                            param: "companyId",
                            msg: ValidationReasons.COMPANY_NOT_FOUND(
                                test_company_blocked._id
                            ),
                        }),
                    ])
                );
            });

            test("should fail if company hasn't finished registration", async () => {
                const res = await test_agent
                    .get(
                        `/company/${test_company_with_unfinished_registration._id}`
                    )
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty(
                    "error_code",
                    ErrorTypes.VALIDATION_ERROR
                );
                expect(res.body).toHaveProperty(
                    "errors",
                    expect.arrayContaining([
                        expect.objectContaining({
                            param: "companyId",
                            msg: ValidationReasons.COMPANY_NOT_FOUND(
                                test_company_with_unfinished_registration._id
                            ),
                        }),
                    ])
                );
            });
        });

        describe("With Auth", () => {
            test("should return hidden offers when user is owner", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_with_hidden_offer)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .get(`/company/${test_company_with_hidden_offer._id}`)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("offers", [
                    expect.objectContaining({
                        _id: test_offer_hidden._id.toString(),
                    }),
                ]);
                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_with_hidden_offer._id.toString()
                );
            });

            test("should succeed if company is disabled and user is owner", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_disabled_company)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .get(`/company/${test_company_disabled._id}`)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_disabled._id.toString()
                );
            });

            test("should fail if company is blocked and user is owner", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_blocked_company)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .get(`/company/${test_company_blocked._id}`)
                    .expect(HTTPStatus.FORBIDDEN);

                expect(res.body).toHaveProperty(
                    "error_code",
                    ErrorTypes.FORBIDDEN
                );
                expect(res.body).toHaveProperty(
                    "errors",
                    expect.arrayContaining([
                        expect.objectContaining({
                            msg: ValidationReasons.COMPANY_BLOCKED,
                        }),
                    ])
                );
            });

            test("should fail if company hasn't finished registration and user is owner", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_with_unfinished_registration)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .get(
                        `/company/${test_company_with_unfinished_registration._id}`
                    )
                    .expect(HTTPStatus.FORBIDDEN);

                expect(res.body).toHaveProperty(
                    "error_code",
                    ErrorTypes.FORBIDDEN
                );
                expect(res.body).toHaveProperty(
                    "errors",
                    expect.arrayContaining([
                        expect.objectContaining({
                            msg: ValidationReasons.REGISTRATION_NOT_FINISHED,
                        }),
                    ])
                );
            });

            test("should return hidden offers when user is admin", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .get(`/company/${test_company_with_hidden_offer._id}`)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("offers", [
                    expect.objectContaining({
                        _id: test_offer_hidden._id.toString(),
                    }),
                ]);
                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_with_hidden_offer._id.toString()
                );
            });

            test("should succeed if company is disabled and user is admin", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .get(`/company/${test_company_disabled._id}`)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_disabled._id.toString()
                );
            });

            test("should succeed if company is blocked and user is admin", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .get(`/company/${test_company_blocked._id}`)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_blocked._id.toString()
                );
            });

            test("should fail if company hasn't finished registration and user is admin", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .get(
                        `/company/${test_company_with_unfinished_registration._id}`
                    )
                    .expect(HTTPStatus.FORBIDDEN);

                expect(res.body).toHaveProperty(
                    "error_code",
                    ErrorTypes.FORBIDDEN
                );
                expect(res.body).toHaveProperty(
                    "errors",
                    expect.arrayContaining([
                        expect.objectContaining({
                            msg: ValidationReasons.REGISTRATION_NOT_FINISHED,
                        }),
                    ])
                );
            });

            test("should return hidden offers when user is god", async () => {
                const res = await test_agent
                    .get(`/company/${test_company_with_hidden_offer._id}`)
                    .send(withGodToken())
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("offers", [
                    expect.objectContaining({
                        _id: test_offer_hidden._id.toString(),
                    }),
                ]);
                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_with_hidden_offer._id.toString()
                );
            });

            test("should succeed if company is disabled and user is god", async () => {
                const res = await test_agent
                    .get(`/company/${test_company_disabled._id}`)
                    .send(withGodToken())
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_disabled._id.toString()
                );
            });

            test("should succeed if company is blocked and user is god", async () => {
                const res = await test_agent
                    .get(`/company/${test_company_blocked._id}`)
                    .send(withGodToken())
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_blocked._id.toString()
                );
            });

            test("should fail if company hasn't finished registration and user is god", async () => {
                const res = await test_agent
                    .get(
                        `/company/${test_company_with_unfinished_registration._id}`
                    )
                    .send(withGodToken())
                    .expect(HTTPStatus.FORBIDDEN);

                expect(res.body).toHaveProperty(
                    "error_code",
                    ErrorTypes.FORBIDDEN
                );
                expect(res.body).toHaveProperty(
                    "errors",
                    expect.arrayContaining([
                        expect.objectContaining({
                            msg: ValidationReasons.REGISTRATION_NOT_FINISHED,
                        }),
                    ])
                );
            });
        });
    });

    describe("POST /company/application/finish", () => {

        describe("Without Auth", () => {
            test("should respond with forbidden", async () => {
                const emptyRes = await request()
                    .post("/company/application/finish");

                expect(emptyRes.status).toBe(HTTPStatus.UNAUTHORIZED);
            });
        });

        describe("With Auth", () => {
            const test_agent = agent();
            const test_user = {
                email: "user@email.com",
                password: "password123",
            };

            const company_data = {
                name: "Company Ltd",
            };

            beforeEach(async () => {
                await Company.deleteMany({});
                const test_company = await Company.create({ name: company_data.name });
                await Account.deleteMany({});
                await Account.create({ email: test_user.email, password: await hash(test_user.password), company: test_company._id });

                // Login
                await test_agent
                    .post("/auth/login")
                    .send(test_user)
                    .expect(200);
            });

            test("should finish the application", async () => {
                await test_agent
                    .post("/company/application/finish")
                    .attach("logo", "test/data/logo-niaefeup.png")
                    .field("bio", "A very interesting and compelling bio")
                    .field("locations", ["Lisbon", "London"])
                    .field("contacts", ["contact1", "contact2"])
                    .expect(HTTPStatus.OK);

                const test_company = [... await Company.find({})][0];
                expect([...test_company.contacts]).toEqual(["contact1", "contact2"]);
                expect([...test_company.locations]).toEqual(["Lisbon", "London"]);
                expect(test_company.hasFinishedRegistration).toBe(true);
                expect(test_company.bio).toBe("A very interesting and compelling bio");
                const filename = path.join(`${config.upload_folder}/${test_company.id}.png`);
                expect(fs.existsSync(filename)).toBe(true);

                const res = await test_agent
                    .post("/company/application/finish")
                    .attach("logo", "test/data/logo-niaefeup.png")
                    .field("bio", "A very interesting and compelling bio")
                    .field("contacts", ["contact1", "contact2"])
                    .field("locations", ["Lisbon", "London"])
                    .expect(HTTPStatus.FORBIDDEN);

                expect(res.body.errors).toContainEqual(
                    { msg: ValidationReasons.REGISTRATION_FINISHED }
                );

                // clean up file created
                fs.unlinkSync(filename);
            });

            test("should finish the application with single contact", async () => {
                await test_agent
                    .post("/company/application/finish")
                    .attach("logo", "test/data/logo-niaefeup.png")
                    .field("bio", "A very interesting and compelling bio")
                    .field("locations", ["Lisbon", "London"])
                    .field("contacts", "contact1")
                    .expect(HTTPStatus.OK);

                const test_company = [... await Company.find({})][0];
                expect([...test_company.contacts]).toEqual(["contact1"]);
                expect([...test_company.locations]).toEqual(["Lisbon", "London"]);
                expect(test_company.hasFinishedRegistration).toBe(true);
                expect(test_company.bio).toBe("A very interesting and compelling bio");
                const filename = path.join(`${config.upload_folder}/${test_company.id}.png`);
                expect(fs.existsSync(filename)).toBe(true);

                const res = await test_agent
                    .post("/company/application/finish")
                    .attach("logo", "test/data/logo-niaefeup.png")
                    .field("bio", "A very interesting and compelling bio")
                    .field("locations", ["Lisbon", "London"])
                    .field("contacts", "contact2")
                    .expect(HTTPStatus.FORBIDDEN);

                expect(res.body.errors).toContainEqual(
                    { msg: ValidationReasons.REGISTRATION_FINISHED }
                );

                // clean up file created
                fs.unlinkSync(filename);
            });

            describe("logo", () => {

                test("should return error when the logo is missing", async () => {
                    const res = await test_agent
                        .post("/company/application/finish")
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                    expect(res.body.errors).toContainEqual({
                        "location": "body",
                        "msg": ValidationReasons.REQUIRED,
                        "param": "logo",
                    });
                });

                test("should return error when the logo is missing", async () => {
                    const res = await test_agent
                        .post("/company/application/finish")
                        .attach("logo", fileURLToPath(import.meta.url))
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                    expect(res.body.errors).toContainEqual({
                        "location": "body",
                        "msg": ValidationReasons.IMAGE_FORMAT,
                        "param": "logo",
                    });
                });

                test("should return an error when the image size is greater than the max size", async () => {
                    const res = await test_agent
                        .post("/company/application/finish")
                        .attach("logo", "test/data/logo-niaefeup-10mb.png")
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                    expect(res.body.errors).toContainEqual({
                        "location": "body",
                        "msg": ValidationReasons.FILE_TOO_LARGE(MAX_FILE_SIZE_MB),
                        "param": "logo",
                    });
                });

            });

            describe("bio", () => {
                test("should return an error because the bio is required", async () => {

                    const res = await test_agent
                        .post("/company/application/finish")
                        .attach("logo", "test/data/logo-niaefeup.png")
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                    expect(res.body.errors).toContainEqual({
                        "location": "body",
                        "msg": ValidationReasons.REQUIRED,
                        "param": "bio",
                    });

                });


                test("should return an error because the bio is too long", async () => {
                    const long_bio = "a".repeat(CompanyConstants.bio.max_length + 1);
                    const res = await test_agent
                        .post("/company/application/finish")
                        .attach("logo", "test/data/logo-niaefeup.png")
                        .field("bio", long_bio)
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                    expect(res.body.errors).toContainEqual({
                        "location": "body",
                        "msg": ValidationReasons.TOO_LONG(CompanyConstants.bio.max_length),
                        "param": "bio",
                        "value": long_bio
                    });

                });
            });

            describe("contacts", () => {

                test("should return an error because the contacts are required", async () => {

                    const res = await test_agent
                        .post("/company/application/finish")
                        .attach("logo", "test/data/logo-niaefeup.png")
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                    expect(res.body.errors).toContainEqual({
                        "location": "body",
                        "msg": ValidationReasons.REQUIRED,
                        "param": "contacts",
                    });

                });


                test("should return an error because the contacts is too long", async () => {
                    const contacts = new Array(CompanyConstants.contacts.max_length + 1)
                        .fill("contact");
                    const res = await test_agent
                        .post("/company/application/finish")
                        .attach("logo", "test/data/logo-niaefeup.png")
                        .field("contacts", contacts)
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                    expect(res.body.errors).toContainEqual({
                        "location": "body",
                        "msg": ValidationReasons.ARRAY_SIZE(CompanyConstants.contacts.min_length, CompanyConstants.contacts.max_length),
                        "param": "contacts",
                        "value": contacts
                    });

                });
            });


            describe("social", () => {
                test("should return an error because the social media is too long", async () => {
                    const social = new Array(CompanyConstants.social.max_length + 1)
                        .fill("social");
                    const res = await test_agent
                        .post("/company/application/finish")
                        .attach("logo", "test/data/logo-niaefeup.png")
                        .field("social", social)
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                    expect(res.body.errors).toContainEqual({
                        "location": "body",
                        "msg": ValidationReasons.ARRAY_SIZE(CompanyConstants.social.min_length, CompanyConstants.social.max_length),
                        "param": "social",
                        "value": social
                    });
                });
            });

            describe("locations", () => {
                test("should return an error because the at least one location is required", async () => {
                    const res = await test_agent
                        .post("/company/application/finish")
                        .attach("logo", "test/data/logo-niaefeup.png")
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(res.body.errors).toContainEqual({
                        "location": "body",
                        "msg": ValidationReasons.REQUIRED,
                        "param": "locations",
                    });
                });
            });

            describe("images", () => {
                test("should return an error because the images array is too long", async () => {
                    const images = new Array(CompanyConstants.images.max_length + 1)
                        .fill("test/data/logo-niaefeup.png");

                    const res = await test_agent
                        .post("/company/application/finish")
                        .attach("logo", "test/data/logo-niaefeup.png")
                        .attach("images", images)
                        .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                    expect(res.body.errors).toContainEqual({
                        "location": "body",
                        "msg": ValidationReasons.ARRAY_SIZE(CompanyConstants.images.min_length, CompanyConstants.images.max_length),
                        "param": "images",
                        "value": images
                    });
                });
            });


        });
    });

    describe("PUT /company/:companyId/block", () => {
        const test_agent = agent();

        const company_data = {
            name: "Company Ltd"
        };

        const test_users = Array(4).fill({}).map((_c, idx) => ({
            email: `test_email_${idx}@email.com`,
            password: "password123",
        }));

        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };

        const adminReason = "An admin reason!";

        let test_company_1, test_company_2, blocked_test_company_2, test_email_company;

        beforeAll(async () => {
            await Company.deleteMany({});
            test_company_1 = await Company.create({ name: company_data.name, hasFinishedRegistration: true });
            test_company_2 = await Company.create({ name: company_data.name, hasFinishedRegistration: true });
            test_email_company = await Company.create({ name: company_data.name, hasFinishedRegistration: true });
            blocked_test_company_2 = await Company.create({ name: company_data.name, hasFinishedRegistration: true, isBlocked: true });
            await Account.deleteMany({});
            [test_email_company, test_company_1, test_company_2, blocked_test_company_2]
                .forEach(async (company, idx) => {
                    await Account.create({
                        email: test_users[idx].email,
                        password: await hash(test_users[idx].password),
                        company: company._id
                    });
                });

            await Account.create({
                email: test_user_admin.email,
                password: await hash(test_user_admin.password),
                isAdmin: true
            });
        });


        test("should fail if not logged in", async () => {
            await test_agent
                .del("/auth/login");

            const res = await test_agent
                .put(`/company/${test_company_1.id}/block`)
                .expect(HTTPStatus.UNAUTHORIZED);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INSUFFICIENT_PERMISSIONS);
        });

        test("should fail if logged in as company", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_users[1])
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/company/${test_company_1.id}/block`)
                .expect(HTTPStatus.UNAUTHORIZED);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INSUFFICIENT_PERMISSIONS);
        });


        test("should fail if admin reason not provided", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/company/${test_company_1.id}/block`)
                .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("param", "adminReason");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.REQUIRED);
        });

        test("should allow if logged in as admin", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/company/${test_company_1.id}/block`)
                .send({ adminReason })
                .expect(HTTPStatus.OK);
            expect(res.body).toHaveProperty("isBlocked", true);
            expect(res.body).toHaveProperty("adminReason", adminReason);
        });

        test("should fail if not a valid id", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put("/company/123/block")
                .send({ adminReason })
                .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("param", "companyId");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.OBJECT_ID);
        });

        test("should fail if company does not exist", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const id = "111111111111111111111111";
            const res = await test_agent
                .put(`/company/${id}/block`)
                .send({ adminReason })
                .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("param", "companyId");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.COMPANY_NOT_FOUND(id));
        });

        test("should allow with god token", async () => {
            await test_agent
                .del("/auth/login");

            const res = await test_agent
                .put(`/company/${test_company_2.id}/block`)
                .send(withGodToken({ adminReason }))
                .expect(HTTPStatus.OK);
            expect(res.body).toHaveProperty("isBlocked", true);
            expect(res.body).toHaveProperty("adminReason", adminReason);
        });

        test("should send an email to the company user when it is blocked", async () => {
            await test_agent
                .del("/auth/login");
            await test_agent
                .put(`/company/${test_email_company._id}/block`)
                .send(withGodToken({ adminReason }))
                .expect(HTTPStatus.OK);

            const emailOptions = COMPANY_BLOCKED_NOTIFICATION(
                test_email_company.name
            );

            expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: emailOptions.subject,
                to: test_users[0].email,
                template: emailOptions.template,
                context: emailOptions.context,
            }));
        });

        describe("testing with offers", () => {
            let test_company;

            beforeEach(async () => {
                const company = {
                    email: "test_company_email_@email.com",
                    password: "password123",
                };

                await Company.deleteMany({});
                test_company = await Company.create({
                    name: company_data.name,
                    hasFinishedRegistration: true,
                    logo: "http://awebsite.com/alogo.jpg"
                });


                await Account.deleteMany({});
                await Account.create({
                    email: company.email,
                    password: await hash(company.password),
                    company: test_company._id });

                await Account.create({
                    email: test_user_admin.email,
                    password: await hash(test_user_admin.password),
                    isAdmin: true
                });
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);
            });

            test("should block active offers", async () => {

                const offers = Array(3).fill(await Offer.create({
                    ...generateTestOffer({
                        "publishDate": (new Date(Date.now())).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                    }),
                    owner: test_company._id,
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo
                }));

                const res = await test_agent
                    .put(`/company/${test_company.id}/block`)
                    .send({ adminReason })
                    .expect(HTTPStatus.OK);
                expect(res.body).toHaveProperty("isBlocked", true);
                expect(res.body).toHaveProperty("adminReason", adminReason);


                for (const offer of offers) {
                    const updated_offer = await Offer.findById(offer._id);

                    expect(updated_offer).toHaveProperty("hiddenReason", OfferConstants.HiddenOfferReasons.COMPANY_BLOCKED);
                    expect(updated_offer).toHaveProperty("isHidden", true);
                }
            });

            test("should not override offers already hidden", async () => {

                const offer = await Offer.create({
                    ...generateTestOffer({
                        "publishDate": (new Date(Date.now())).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                    }),
                    owner: test_company._id,
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                    isHidden: true,
                    hiddenReason: OfferConstants.HiddenOfferReasons.ADMIN_BLOCK
                });

                const res = await test_agent
                    .put(`/company/${test_company.id}/block`)
                    .send({ adminReason })
                    .expect(HTTPStatus.OK);
                expect(res.body).toHaveProperty("isBlocked", true);
                expect(res.body).toHaveProperty("adminReason", adminReason);


                const updated_offer = await Offer.findById(offer._id);

                expect(updated_offer).toHaveProperty("hiddenReason", OfferConstants.HiddenOfferReasons.ADMIN_BLOCK);
                expect(updated_offer).toHaveProperty("isHidden", true);

            });
        });
    });

    describe("PUT /company/:companyId/unblock", () => {
        const test_agent = agent();

        const company_data = {
            name: "Company Ltd"
        };
        const test_user_1 = {
            email: "user1@email.com",
            password: "password123",
        };
        const test_user_2 = {
            email: "user2@email.com",
            password: "password123",
        };
        const test_user_email = {
            email: "test_email@email.com",
            password: "password123",
        };
        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };

        let test_company_1, test_company_2, test_company_email;

        beforeAll(async () => {
            await Company.deleteMany({});
            test_company_1 = await Company.create({ name: company_data.name, hasFinishedRegistration: true, isBlocked: true });
            test_company_2 = await Company.create({ name: company_data.name, hasFinishedRegistration: true, isBlocked: true });
            test_company_email = await Company.create({ name: company_data.name, hasFinishedRegistration: true, isBlocked: true });
            await Account.deleteMany({});
            await Account.create({ email: test_user_1.email, password: await hash(test_user_1.password), company: test_company_1._id });
            await Account.create({ email: test_user_2.email, password: await hash(test_user_2.password), company: test_company_2._id });
            await Account.create({
                email: test_user_email.email,
                password: await hash(test_user_email.password),
                company: test_company_email._id
            });
            await Account.create({
                email: test_user_admin.email,
                password: await hash(test_user_admin.password),
                isAdmin: true
            });
        });


        test("should fail if not logged in", async () => {
            await test_agent
                .del("/auth/login");

            const res = await test_agent
                .put(`/company/${test_company_1.id}/unblock`)
                .expect(HTTPStatus.UNAUTHORIZED);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INSUFFICIENT_PERMISSIONS);
        });

        test("should fail if logged in as company", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_1)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/company/${test_company_1.id}/unblock`)
                .expect(HTTPStatus.UNAUTHORIZED);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INSUFFICIENT_PERMISSIONS);
        });

        test("should allow if logged in as admin", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/company/${test_company_1.id}/unblock`)
                .expect(HTTPStatus.OK);
            expect(res.body).toHaveProperty("isBlocked", false);
            expect(res.body).not.toHaveProperty("adminReason");
        });

        test("should fail if not a valid id", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put("/company/123/unblock")
                .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("param", "companyId");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.OBJECT_ID);
        });

        test("should fail if company does not exist", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const id = "111111111111111111111111";
            const res = await test_agent
                .put(`/company/${id}/unblock`)
                .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("param", "companyId");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.COMPANY_NOT_FOUND(id));
        });

        test("should allow with god token", async () => {
            await test_agent
                .del("/auth/login");

            const res = await test_agent
                .put(`/company/${test_company_2.id}/unblock`)
                .send(withGodToken())
                .expect(HTTPStatus.OK);
            expect(res.body).toHaveProperty("isBlocked", false);
        });

        test("should send an email to the company user when it is unblocked", async () => {
            await test_agent
                .del("/auth/login");
            await test_agent
                .put(`/company/${test_company_email._id}/unblock`)
                .send(withGodToken())
                .expect(HTTPStatus.OK);

            const emailOptions = COMPANY_UNBLOCKED_NOTIFICATION(
                test_company_email.name
            );

            expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: emailOptions.subject,
                to: test_user_email.email,
                template: emailOptions.template,
                context: emailOptions.context,
            }));
        });


        describe("testing with offers", () => {
            let test_company;

            beforeEach(async () => {
                const company = {
                    email: "test_company_email_@email.com",
                    password: "password123",
                };

                await Company.deleteMany({});
                test_company = await Company.create({
                    name: company_data.name,
                    hasFinishedRegistration: true,
                    logo: "http://awebsite.com/alogo.jpg"
                });


                await Account.deleteMany({});
                await Account.create({
                    email: company.email,
                    password: await hash(company.password),
                    company: test_company._id });

                await Account.create({
                    email: test_user_admin.email,
                    password: await hash(test_user_admin.password),
                    isAdmin: true
                });
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);
            });

            test("should unblock offers blocked by company block", async () => {

                const offers = Array(3).fill(await Offer.create({
                    ...generateTestOffer({
                        "publishDate": (new Date(Date.now())).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                    }),
                    owner: test_company._id,
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                    isHidden: true,
                    hiddenReason: OfferConstants.HiddenOfferReasons.COMPANY_BLOCKED
                }));

                const res = await test_agent
                    .put(`/company/${test_company.id}/unblock`)
                    .expect(HTTPStatus.OK);
                expect(res.body).toHaveProperty("isBlocked", false);


                for (const offer of offers) {
                    expect(await Offer.findById(offer._id)).toHaveProperty("isHidden", false);
                }
            });

            test("should not unblock offers hidden by company request", async () => {

                const offer = await Offer.create({
                    ...generateTestOffer({
                        "publishDate": (new Date(Date.now())).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                    }),
                    owner: test_company._id,
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                    isHidden: true,
                    hiddenReason: OfferConstants.HiddenOfferReasons.COMPANY_REQUEST
                });

                const res = await test_agent
                    .put(`/company/${test_company.id}/unblock`)
                    .expect(HTTPStatus.OK);
                expect(res.body).toHaveProperty("isBlocked", false);


                const updated_offer = await Offer.findById(offer._id);

                expect(updated_offer).toHaveProperty("hiddenReason", OfferConstants.HiddenOfferReasons.COMPANY_REQUEST);
                expect(updated_offer).toHaveProperty("isHidden", true);

            });

            test("should not unblock offers hidden by admin request", async () => {

                const offer = await Offer.create({
                    ...generateTestOffer({
                        "publishDate": (new Date(Date.now())).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                    }),
                    owner: test_company._id,
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                    isHidden: true,
                    hiddenReason: OfferConstants.HiddenOfferReasons.ADMIN_BLOCK
                });

                const res = await test_agent
                    .put(`/company/${test_company.id}/unblock`)
                    .expect(HTTPStatus.OK);
                expect(res.body).toHaveProperty("isBlocked", false);


                const updated_offer = await Offer.findById(offer._id);

                expect(updated_offer).toHaveProperty("hiddenReason", OfferConstants.HiddenOfferReasons.ADMIN_BLOCK);
                expect(updated_offer).toHaveProperty("isHidden", true);

            });

        });


    });

    describe("PUT /company/enable", () => {

        let disabled_test_company_1, disabled_test_company_2, disabled_test_company_3, disabled_test_company_4, disabled_test_company_mail;
        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };
        const test_user_company_1 = {
            email: "company1@email.com",
            password: "password123",
        };
        const test_user_company_2 = {
            email: "company2@email.com",
            password: "password123",
        };
        const test_user_company_3 = {
            email: "company3@email.com",
            password: "password123",
        };
        const test_user_company_4 = {
            email: "company4@email.com",
            password: "password123",
        };
        const test_user_mail = {
            email: "company_mail@email.com",
            password: "password123",
        };

        const test_agent = agent();

        beforeAll(async () => {
            await test_agent
                .delete("/auth/login")
                .expect(HTTPStatus.OK);

            await Company.deleteMany({});

            [
                disabled_test_company_1,
                disabled_test_company_2,
                disabled_test_company_3,
                disabled_test_company_4,
                disabled_test_company_mail
            ] = await Company.create([
                {
                    name: "disabled-test-company-1",
                    isDisabled: true,
                    hasFinishedRegistration: true
                }, {
                    name: "disabled-test-company-2",
                    isDisabled: true,
                    hasFinishedRegistration: true
                }, {
                    name: "disabled-test-company-3",
                    isDisabled: true,
                    hasFinishedRegistration: true
                }, {
                    name: "disabled-test-company-4",
                    logo: "http://awebsite.com/alogo.jpg",
                    isDisabled: true,
                    hasFinishedRegistration: true
                }, {
                    name: "disabled-test-company-mail",
                    isDisabled: true,
                    hasFinishedRegistration: true
                }
            ]);

            await Account.deleteMany({});
            await Account.create({
                email: test_user_admin.email,
                password: await hash(test_user_admin.password),
                isAdmin: true
            });
            await Account.create({
                email: test_user_company_1.email,
                password: await hash(test_user_company_1.password),
                company: disabled_test_company_1._id
            });
            await Account.create({
                email: test_user_company_2.email,
                password: await hash(test_user_company_2.password),
                company: disabled_test_company_2._id
            });
            await Account.create({
                email: test_user_company_3.email,
                password: await hash(test_user_company_3.password),
                company: disabled_test_company_3._id
            });
            await Account.create({
                email: test_user_company_4.email,
                password: await hash(test_user_company_4.password),
                company: disabled_test_company_4._id
            });
            await Account.create({
                email: test_user_mail.email,
                password: await hash(test_user_mail.password),
                company: disabled_test_company_mail._id
            });

            const offer = {
                title: "Test Offer",
                publishDate: new Date(Date.now()),
                publishEndDate: new Date(Date.now() + (DAY_TO_MS)),
                description: "For Testing Purposes",
                contacts: ["geral@niaefeup.pt", "229417766"],
                jobType: "SUMMER INTERNSHIP",
                jobMinDuration: 1,
                jobMaxDuration: 6,
                fields: ["DEVOPS", "BACKEND", "OTHER"],
                technologies: ["React", "CSS"],
                location: "Testing Street, Test City, 123",
                requirements: ["The candidate must be tested", "Fluent in testJS"],
                owner: disabled_test_company_4._id,
                ownerName: disabled_test_company_4.name,
                ownerLogo: disabled_test_company_4.logo,
                isHidden: true,
                hiddenReason: OfferConstants.HiddenOfferReasons.COMPANY_DISABLED,
            };

            await Offer.create([offer, offer]);

        });

        afterEach(async () => {
            await test_agent
                .delete("/auth/login")
                .expect(HTTPStatus.OK);
        });

        afterAll(async () => {
            await Account.deleteMany({});
            await Company.deleteMany({});
        });

        describe("Id validation", () => {
            test("Should fail if using invalid id", async () => {

                const res = await test_agent
                    .put("/company/123/enable")
                    .send(withGodToken())
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty("param", "companyId");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.OBJECT_ID);
            });

            test("Should fail if company does not exist", async () => {

                const id = "111111111111111111111111";
                const res = await test_agent
                    .put(`/company/${id}/enable`)
                    .send(withGodToken())
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty("param", "companyId");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.COMPANY_NOT_FOUND(id));
            });
        });

        test("should fail to enable if logged as different company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/company/${disabled_test_company_1._id}/enable`);

            expect(res.status).toBe(HTTPStatus.FORBIDDEN);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS_COMPANY_SETTINGS });

        });

        test("should fail to enable if not logged", async () => {

            const res = await test_agent
                .put(`/company/${disabled_test_company_1._id}/enable`);

            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });

        });

        test("Should enable company if god token is sent", async () => {

            const res = await test_agent
                .put(`/company/${disabled_test_company_3._id}/enable`)
                .send(withGodToken());

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.isDisabled).toBe(false);
        });

        test("Should enable company if logged as admin", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/company/${disabled_test_company_2._id}/enable`);

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.isDisabled).toBe(false);
        });

        test("Should enable company if logged as same company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_1)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/company/${disabled_test_company_1._id}/enable`);

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.isDisabled).toBe(false);
        });

        test("should change offers' 'isHidden' on company enable", async () => {

            const offersBefore = await Offer.find({ owner: disabled_test_company_4._id });

            expect(offersBefore.every(({ isHidden }) => isHidden === true)).toBe(true);
            expect(offersBefore.every(
                ({ hiddenReason }) => hiddenReason === OfferConstants.HiddenOfferReasons.COMPANY_DISABLED)
            ).toBe(true);

            const res = await test_agent
                .put(`/company/${disabled_test_company_4._id}/enable`)
                .send(withGodToken());

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.isDisabled).toBe(false);

            const offersAfter = await Offer.find({ owner: disabled_test_company_4._id });

            expect(offersAfter.every(({ isHidden }) => isHidden === false)).toBe(true);
            expect(offersAfter.every(({ hiddenReason }) => hiddenReason === undefined)).toBe(true);
        });

        test("should send an email to the company user when it is enabled", async () => {
            await test_agent
                .put(`/company/${disabled_test_company_mail._id}/enable`)
                .send(withGodToken())
                .expect(HTTPStatus.OK);

            const emailOptions = COMPANY_ENABLED_NOTIFICATION(
                disabled_test_company_mail.name
            );

            expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: emailOptions.subject,
                to: test_user_mail.email,
                template: emailOptions.template,
                context: emailOptions.context,
            }));
        });
    });

    describe("PUT /company/disable", () => {

        let test_company_1, test_company_2, test_company_3, test_company_mail;
        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };
        const test_user_company_1 = {
            email: "company1@email.com",
            password: "password123",
        };
        const test_user_company_2 = {
            email: "company2@email.com",
            password: "password123",
        };
        const test_user_company_3 = {
            email: "company3@email.com",
            password: "password123",
        };
        const test_user_company_mail = {
            email: "company_mail@email.com",
            password: "password123",
        };

        const test_agent = agent();

        beforeAll(async () => {

            await test_agent
                .delete("/auth/login")
                .expect(HTTPStatus.OK);

            await Company.deleteMany({});

            [test_company_1, test_company_2, test_company_3, test_company_mail] = await Company.create([
                {
                    name: "test-company-1",
                    hasFinishedRegistration: true
                }, {
                    name: "test-company-2",
                    hasFinishedRegistration: true
                }, {
                    name: "test-company-3",
                    logo: "http://awebsite.com/alogo.jpg",
                    hasFinishedRegistration: true
                }, {
                    name: "test-company-mail",
                    hasFinishedRegistration: true
                }
            ]);

            await Account.deleteMany({});
            await Account.create({
                email: test_user_admin.email,
                password: await hash(test_user_admin.password),
                isAdmin: true
            });
            await Account.create({
                email: test_user_company_1.email,
                password: await hash(test_user_company_1.password),
                company: test_company_1._id
            });
            await Account.create({
                email: test_user_company_2.email,
                password: await hash(test_user_company_2.password),
                company: test_company_2._id
            });
            await Account.create({
                email: test_user_company_3.email,
                password: await hash(test_user_company_3.password),
                company: test_company_3._id
            });
            await Account.create({
                email: test_user_company_mail.email,
                password: await hash(test_user_company_mail.password),
                company: test_company_mail._id
            });

            const offer = {
                title: "Test Offer",
                publishDate: new Date(Date.now()),
                publishEndDate: new Date(Date.now() + (DAY_TO_MS)),
                description: "For Testing Purposes",
                contacts: ["geral@niaefeup.pt", "229417766"],
                jobType: "SUMMER INTERNSHIP",
                jobMinDuration: 2,
                jobMaxDuration: 6,
                fields: ["DEVOPS", "BACKEND", "OTHER"],
                technologies: ["React", "CSS"],
                location: "Testing Street, Test City, 123",
                requirements: ["The candidate must be tested", "Fluent in testJS"],
                owner: test_company_3._id,
                ownerName: test_company_3.name,
                ownerLogo: test_company_3.logo,
            };

            await Offer.create([offer, offer]);
        });

        afterEach(async () => {
            await test_agent
                .delete("/auth/login")
                .expect(HTTPStatus.OK);
        });

        afterAll(async () => {
            await Account.deleteMany({});
            await Company.deleteMany({});
        });

        describe("Id validation", () => {
            test("Should fail if using invalid id", async () => {

                const res = await test_agent
                    .put("/company/123/disable")
                    .send(withGodToken())
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty("param", "companyId");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.OBJECT_ID);
            });

            test("Should fail if company does not exist", async () => {

                const id = "111111111111111111111111";
                const res = await test_agent
                    .put(`/company/${id}/disable`)
                    .send(withGodToken())
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty("param", "companyId");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.COMPANY_NOT_FOUND(id));
            });
        });

        test("should fail to disable company if logged as different company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/company/${test_company_1._id}/disable`);

            expect(res.status).toBe(HTTPStatus.FORBIDDEN);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS_COMPANY_SETTINGS });
        });

        test("should fail to disable company if logged as admin", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/company/${test_company_1._id}/disable`);

            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });
        });

        test("should fail to disable company if not logged", async () => {

            const res = await test_agent
                .put(`/company/${test_company_1._id}/disable`);

            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });
        });

        test("Should disable company if god token is sent", async () => {

            const res = await test_agent
                .put(`/company/${test_company_2._id}/disable`)
                .send(withGodToken());

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.isDisabled).toBe(true);
        });

        test("Should disable company if logged as same company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_1)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/company/${test_company_1._id}/disable`);

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.isDisabled).toBe(true);
        });

        test("should change offers' 'isHidden' on company disable", async () => {

            const offersBefore = await Offer.find({ owner: test_company_3._id });

            expect(offersBefore.every(({ isHidden }) => isHidden === false)).toBe(true);
            expect(offersBefore.every(({ hiddenReason }) => hiddenReason === undefined)).toBe(true);

            const res = await test_agent
                .put(`/company/${test_company_3._id}/disable`)
                .send(withGodToken());

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.isDisabled).toBe(true);

            const offersAfter = await Offer.find({ owner: test_company_3._id });

            expect(offersAfter.every(({ isHidden }) => isHidden === true)).toBe(true);
            expect(offersAfter.every(({ hiddenReason }) => hiddenReason === OfferConstants.HiddenOfferReasons.COMPANY_DISABLED)).toBe(true);
        });

        test("should send an email to the company user when it is disabled", async () => {
            await test_agent
                .put(`/company/${test_company_mail._id}/disable`)
                .send(withGodToken())
                .expect(HTTPStatus.OK);

            const emailOptions = COMPANY_DISABLED_NOTIFICATION(
                test_company_mail.name
            );

            expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: emailOptions.subject,
                to: test_user_company_mail.email,
                template: emailOptions.template,
                context: emailOptions.context,
            }));
        });
    });

    describe("POST /company/delete", () => {
        let test_company_1, test_company_2;
        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };
        const test_user_company_1 = {
            email: "company1@email.com",
            password: "password123",
        };
        const test_user_company_2 = {
            email: "company2@email.com",
            password: "password123",
        };

        const test_agent = agent();

        beforeEach(async () => {
            await test_agent
                .delete("/auth/login")
                .expect(HTTPStatus.OK);

            await Company.deleteMany({});

            [test_company_1, test_company_2] = await Company.create([
                {
                    name: "test-company-1",
                    hasFinishedRegistration: true
                }, {
                    name: "test-company-2",
                    hasFinishedRegistration: true,
                    logo: "http://oniebuedafixe.com/wow.png"
                }
            ]);

            await Account.deleteMany({});
            await Account.create({
                email: test_user_admin.email,
                password: await hash(test_user_admin.password),
                isAdmin: true
            });
            await Account.create({
                email: test_user_company_1.email,
                password: await hash(test_user_company_1.password),
                company: test_company_1._id
            });
            await Account.create({
                email: test_user_company_2.email,
                password: await hash(test_user_company_2.password),
                company: test_company_2._id
            });

            const offer = generateTestOffer({
                owner: test_company_2._id,
                ownerName: test_company_2.name,
                ownerLogo: test_company_2.logo,
            });

            await Offer.create([offer, offer]);
        });

        afterAll(async () => {
            await Account.deleteMany({});
            await Company.deleteMany({});
            await Offer.deleteMany({});
        });

        describe("Id validation", () => {
            test("Should fail if using invalid id", async () => {

                const res = await test_agent
                    .post("/company/123/delete")
                    .send(withGodToken())
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty("param", "companyId");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.OBJECT_ID);
            });

            test("Should fail if company does not exist", async () => {

                const id = "111111111111111111111111";
                const res = await test_agent
                    .post(`/company/${id}/delete`)
                    .send(withGodToken())
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty("param", "companyId");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.COMPANY_NOT_FOUND(id));
            });
        });

        test("should fail to delete company if logged as different company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .post(`/company/${test_company_1._id}/delete`);

            expect(res.status).toBe(HTTPStatus.FORBIDDEN);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS_COMPANY_SETTINGS });
        });

        test("should fail to delete company if logged as admin", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .post(`/company/${test_company_1._id}/delete`);

            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });
        });

        test("should fail to delete company if not logged", async () => {

            const res = await test_agent
                .post(`/company/${test_company_1._id}/delete`);

            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toContainEqual({ msg: ValidationReasons.INSUFFICIENT_PERMISSIONS });
        });

        test("Should delete company if god token is sent", async () => {

            const res = await test_agent
                .post(`/company/${test_company_1._id}/delete`)
                .send(withGodToken());

            expect(res.status).toBe(HTTPStatus.OK);
            expect(await Company.exists({ _id: test_company_1._id })).toBeNull();
            expect(await Account.exists({ company: test_company_1._id })).toBeNull();
        });

        test("Should delete company if logged as the same company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_1)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .post(`/company/${test_company_1._id}/delete`);

            expect(res.status).toBe(HTTPStatus.OK);
            expect(await Company.exists({ _id: test_company_1._id })).toBeNull();
            expect(await Account.exists({ company: test_company_1._id })).toBeNull();
        });

        test("Should delete company's offers when it is deleted", async () => {
            const res = await test_agent
                .post(`/company/${test_company_2._id}/delete`)
                .send(withGodToken());

            expect(res.status).toBe(HTTPStatus.OK);
            expect(await Company.exists({ _id: test_company_2._id })).toBeNull();
            expect(await Account.exists({ company: test_company_2._id })).toBeNull();
            expect(await Offer.exists({ owner: test_company_2._id })).toBeNull();
        });

        test("should send an email to the company user when it is deleted", async () => {
            await test_agent
                .post(`/company/${test_company_1._id}/delete`)
                .send(withGodToken())
                .expect(HTTPStatus.OK);

            const emailOptions = COMPANY_DELETED_NOTIFICATION(
                test_company_1.name
            );

            expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: emailOptions.subject,
                to: test_user_company_1.email,
                template: emailOptions.template,
                context: emailOptions.context,
            }));
        });
    });

    describe("GET /company/:companyId/hasReachedMaxConcurrentOffersBetweenDates", () => {
        let test_company_1, test_company_2;
        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };
        const test_user_company_1 = {
            email: "company1@email.com",
            password: "password123",
        };
        const test_user_company_2 = {
            email: "company2@email.com",
            password: "password123",
        };

        const test_agent = agent();

        const publishDate = (new Date(Date.now())).toISOString();
        const publishEndDate = (new Date(Date.now() + (2 * DAY_TO_MS))).toISOString();

        beforeEach(async () => {
            await test_agent
                .delete("/auth/login")
                .expect(HTTPStatus.OK);

            await Company.deleteMany({});

            [test_company_1, test_company_2] = await Company.create([
                {
                    name: "test-company-1",
                    hasFinishedRegistration: true
                }, {
                    name: "test-company-2",
                    hasFinishedRegistration: true,
                    logo: "http://oniebuedafixe.com/wow.png"
                }
            ]);

            await Account.deleteMany({});
            await Account.create({
                email: test_user_admin.email,
                password: await hash(test_user_admin.password),
                isAdmin: true
            });
            await Account.create({
                email: test_user_company_1.email,
                password: await hash(test_user_company_1.password),
                company: test_company_1._id
            });
            await Account.create({
                email: test_user_company_2.email,
                password: await hash(test_user_company_2.password),
                company: test_company_2._id
            });

            const testOffers = Array(CompanyConstants.offers.max_concurrent)
                .fill(generateTestOffer({
                    owner: test_company_2._id,
                    ownerName: test_company_2.name,
                    ownerLogo: test_company_2.logo,
                    "publishDate": (new Date(Date.now())).toISOString(),
                    "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                }));

            await Offer.deleteMany({});
            await Offer.create(testOffers);
        });

        afterAll(async () => {
            await Account.deleteMany({});
            await Company.deleteMany({});
            await Offer.deleteMany({});
        });

        describe("Id validation", () => {
            test("Should fail if using an invalid id", async () => {

                const res = await test_agent
                    .get("/company/123/hasReachedMaxConcurrentOffersBetweenDates")
                    .send(withGodToken({ publishDate, publishEndDate }))
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty("param", "companyId");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.OBJECT_ID);
            });

            test("Should fail if company does not exist", async () => {

                const id = "111111111111111111111111";
                const res = await test_agent
                    .get(`/company/${id}/hasReachedMaxConcurrentOffersBetweenDates`)
                    .send(withGodToken({ publishDate, publishEndDate }))
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty("param", "companyId");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.COMPANY_NOT_FOUND(id));
            });
        });

        describe("Date validation", () => {
            test("Should succeed if publishDate is not specified", async () => {

                const res = await test_agent
                    .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                    .send(withGodToken({ publishEndDate }))
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("maxOffersReached", false);
            });

            test("Should succeed if publishEndDate is not specified", async () => {

                const res = await test_agent
                    .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                    .send(withGodToken({ publishDate }))
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("maxOffersReached", false);
            });

            test("Should succeed if neither publishDate or publishEndDate are specified", async () => {

                const res = await test_agent
                    .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                    .send(withGodToken())
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("maxOffersReached", false);
            });

            test("Should fail if publishDate is after publishEndDate", async () => {

                const res = await test_agent
                    .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                    .send(withGodToken({
                        publishDate: publishEndDate,
                        publishEndDate: publishDate,
                    }))
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty("param", "publishEndDate");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.MUST_BE_AFTER("publishDate"));
            });

            test("Should fail if publishDate doesn't have a date format", async () => {

                const res = await test_agent
                    .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                    .send(withGodToken({ publishDate: "123", publishEndDate }))
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty("param", "publishDate");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.DATE);
            });

            test("Should fail if publishEndDate doesn't have a date format", async () => {

                const res = await test_agent
                    .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                    .send(withGodToken({ publishDate, publishEndDate: "123" }))
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors[0]).toHaveProperty("param", "publishEndDate");
                expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.DATE);
            });
        });

        test("Should fail if not logged in", async () => {

            const res = await test_agent
                .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                .send({ publishDate, publishEndDate })
                .expect(HTTPStatus.UNAUTHORIZED);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INSUFFICIENT_PERMISSIONS);
        });

        test("Should fail if logged as a different company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                .send({ publishDate, publishEndDate })
                .expect(HTTPStatus.FORBIDDEN);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INSUFFICIENT_PERMISSIONS_COMPANY_SETTINGS);
        });

        test("Should succeed if god token is sent", async () => {

            const res = await test_agent
                .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                .send(withGodToken({ publishDate, publishEndDate }))
                .expect(HTTPStatus.OK);

            expect(res.body).toHaveProperty("maxOffersReached", false);
        });

        test("Should succeed if logged as an admin", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                .send({ publishDate, publishEndDate })
                .expect(HTTPStatus.OK);

            expect(res.body).toHaveProperty("maxOffersReached", false);
        });

        test("Should succeed if logged as the same company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_1)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                .send({ publishDate, publishEndDate })
                .expect(HTTPStatus.OK);

            expect(res.body).toHaveProperty("maxOffersReached", false);
        });

        test("Should return true if the company has reached max offers in the time interval", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .get(`/company/${test_company_2._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                .send({ publishDate, publishEndDate })
                .expect(HTTPStatus.OK);

            expect(res.body).toHaveProperty("maxOffersReached", true);
        });
    });

    describe("PUT /company/edit", () => {
        let test_companies;
        let test_company, test_company_blocked, test_company_disabled;
        let test_offer;

        const changing_values = {
            name: "Changed name",
            bio: "Changed bio",
            logo: "test/data/logo-niaefeup.png",
            contacts: ["123", "456"],
        };

        /* Admin, Company, Blocked, Disabled*/
        const test_users = Array(4).fill({}).map((_c, idx) => ({
            email: `test_email_${idx}@email.com`,
            password: "password123",
        }));

        const [test_user_admin, test_user_company, test_user_company_blocked, test_user_company_disabled] = test_users;

        const test_agent = agent();

        beforeAll(async () => {
            await Account.deleteMany({});

            const test_company_data = await generateTestCompany();
            const test_company_blocked_data = await generateTestCompany({ isBlocked: true });
            const test_company_disabled_data = await generateTestCompany({ isDisabled: true });

            test_companies = await Company.create(
                [test_company_data, test_company_blocked_data, test_company_disabled_data],
                { session: null }
            );

            [test_company, test_company_blocked, test_company_disabled] = test_companies;

            test_offer = await Offer.create(
                generateTestOffer({
                    owner: test_company._id,
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                })
            );

            for (let i = 0; i < test_users.length; i++) {
                if (i === 0) {  // Admin
                    await Account.create({
                        email: test_users[i].email,
                        password: await hash(test_users[i].password),
                        isAdmin: true,
                    });
                } else {    // Company
                    await Account.create({
                        email: test_users[i].email,
                        password: await hash(test_users[i].password),
                        company: test_companies[i - 1]._id,
                    });
                }
            }
        });

        afterEach(async () => {
            await test_agent
                .delete("/auth/login")
                .expect(HTTPStatus.OK);
        });

        afterAll(async () => {
            await Company.deleteMany({});
            await Account.deleteMany({});
        });

        describe("ID Validation", () => {
            beforeEach(async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);
            });

            test("Should fail if id is not a valid ObjectID", async () => {
                const id = "123";
                const res = await test_agent
                    .put(`/company/${id}/edit`)
                    .send()
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body.errors).toContainEqual(
                    { "location": "params", "msg": ValidationReasons.OBJECT_ID, "param": "companyId", "value": id }
                );
            });

            test("Should fail if id is not a valid company", async () => {
                const id = "111111111111111111111111";

                const res = await test_agent
                    .put(`/company/${id}/edit`)
                    .send()
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body.errors).toContainEqual(
                    { "location": "params", "msg": ValidationReasons.COMPANY_NOT_FOUND(id), "param": "companyId", "value": id }
                );
            });
        });

        describe("Using a bad user", () => {
            test("Should fail if different user", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company_blocked)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .send({
                        name: changing_values.name,
                    })
                    .expect(HTTPStatus.FORBIDDEN);

                expect(res.body.errors).toContainEqual({ "msg": ValidationReasons.INSUFFICIENT_PERMISSIONS_COMPANY_SETTINGS });
            });

            test("Should fail if not logged in", async () => {
                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .send({
                        bio: changing_values.bio,
                        contacts: changing_values.contacts,
                    })
                    .expect(HTTPStatus.UNAUTHORIZED);

                expect(res.body.errors).toContainEqual({ "msg": ValidationReasons.INSUFFICIENT_PERMISSIONS });
            });
        });

        describe("Using a good user", () => {
            test("Should pass if god", async () => {
                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .send(withGodToken({
                        name: changing_values.name,
                        bio: changing_values.bio,
                    }))
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("name", changing_values.name);
                expect(res.body).toHaveProperty("bio", changing_values.bio);
            });

            test("Should pass if admin", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .field("name", changing_values.name)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("name", changing_values.name);
            });

            test("Should pass if same company", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .field("name", changing_values.name)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("name", changing_values.name);
            });
        });

        test("Offer should be updated", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_company)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/company/${test_company._id}/edit`)
                .send({
                    name: changing_values.name,
                    contacts: changing_values.contacts,
                })
                .expect(HTTPStatus.OK);

            test_offer = await Offer.findById(test_offer._id);

            expect(res.body).toHaveProperty("name", changing_values.name);
            expect(res.body).toHaveProperty("contacts", changing_values.contacts);

            expect(test_offer.ownerName).toEqual(changing_values.name);
            expect(test_offer.contacts).toEqual(changing_values.contacts);
        });

        describe("Updating company logo", () => {
            test("Should fail if not an image", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .attach("logo", "test/data/not-a-logo.txt")
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": ValidationReasons.IMAGE_FORMAT,
                    "param": "logo"
                });
            });

            test("Should fail if image is too big", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .attach("logo", "test/data/logo-niaefeup-10mb.png")
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": ValidationReasons.FILE_TOO_LARGE(MAX_FILE_SIZE_MB),
                    "param": "logo"
                });
            });

            test("Should succeed if image is valid", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .attach("logo", changing_values.logo)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("logo");
            });
        });

        describe("Using disabled/blocked company (god)", () => {
            test("Should fail if company is blocked (god)", async () => {
                const res = await test_agent
                    .put(`/company/${test_company_blocked._id}/edit`)
                    .send(withGodToken({
                        name: "Changing Blocked Company",
                    }))
                    .expect(HTTPStatus.FORBIDDEN);
                expect(res.body.errors).toContainEqual({ "msg": ValidationReasons.COMPANY_BLOCKED });
            });

            test("Should fail if company is disabled (god)", async () => {
                const res = await test_agent
                    .put(`/company/${test_company_disabled._id}/edit`)
                    .send(withGodToken({
                        name: "Changing Disabled Company",
                    }))
                    .expect(HTTPStatus.FORBIDDEN);
                expect(res.body.errors).toContainEqual({ "msg": ValidationReasons.COMPANY_DISABLED });
            });
        });

        describe("Using disabled/blocked company (user)", () => {
            test("Should fail if company is blocked (user)", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company_blocked)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company_blocked._id}/edit`)
                    .send({
                        name: "Changing Blocked Company",
                    })
                    .expect(HTTPStatus.FORBIDDEN);

                expect(res.body.errors).toContainEqual({ "msg": ValidationReasons.COMPANY_BLOCKED });
            });

            test("Should fail if company is disabled (user)", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company_disabled)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company_disabled._id}/edit`)
                    .send({
                        bio: "As user",
                    })
                    .expect(HTTPStatus.FORBIDDEN);
                expect(res.body.errors).toContainEqual({ "msg": ValidationReasons.COMPANY_DISABLED });
            });
        });
    });
});
