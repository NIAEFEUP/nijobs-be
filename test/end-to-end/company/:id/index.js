import { StatusCodes } from "http-status-codes";
import { ErrorTypes } from "../../../../src/api/middleware/errorHandler";
import ValidationReasons from "../../../../src/api/middleware/validators/validationReasons";
import hash from "../../../../src/lib/passwordHashing";
import Account from "../../../../src/models/Account";
import Company from "../../../../src/models/Company";
import Offer from "../../../../src/models/Offer";
import CompanyConstants from "../../../../src/models/constants/Company";
import withGodToken from "../../../utils/GodToken";
import { DAY_TO_MS } from "../../../utils/TimeConstants";

describe("GET /company/:companyId", () => {

    const test_agent = agent();

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

    const test_company_data = {
        name: "test-company",
        hasFinishedRegistration: true,
        logo: "http://awebsite.com/alogo.jpg",
    };

    beforeAll(async () => {
        await Offer.deleteMany({});
        await Account.deleteMany({});
        await Company.deleteMany({});
    });

    afterAll(async () => {
        await Offer.deleteMany({});
        await Account.deleteMany({});
        await Company.deleteMany({});
    });

    afterEach(async () => {
        await test_agent
            .delete("/auth/login")
            .expect(StatusCodes.OK);
    });

    describe("Id Validation", () => {
        test("should fail if invalid id", async () => {
            const res = await test_agent
                .get("/company/123")
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

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
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

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
    });

    describe("Without Auth", () => {

        describe("Without offers", () => {

            let test_company_without_offers;

            beforeAll(async () => {
                test_company_without_offers = await Company.create(test_company_data);
            });

            afterAll(async () => {
                await Company.deleteMany({ _id: test_company_without_offers._id });
            });

            test("should succeed when the company has no offers", async () => {
                const res = await test_agent
                    .get(`/company/${test_company_without_offers.id}`)
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty("offers", []);
                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_without_offers._id.toString()
                );
            });
        });

        describe("With offers", () => {

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

            describe("Below limit", () => {

                let test_company_with_offers_below_limit;
                let offers;

                beforeAll(async () => {
                    test_company_with_offers_below_limit = await Company.create(test_company_data);

                    offers = await createTestOffers(
                        CompanyConstants.offers.max_profile_visible - 1,
                        test_company_with_offers_below_limit
                    );
                });

                afterAll(async () => {
                    // await Offer.deleteMany({ _id: { $in: offers.map((x) => x._id) } }); prevent wasting time to compute the set of ids
                    await Offer.deleteMany({ owner: test_company_with_offers_below_limit._id });
                    await Company.deleteMany({ _id: test_company_with_offers_below_limit._id });
                });

                test("should return all offers when below limit", async () => {
                    const res = await test_agent
                        .get(`/company/${test_company_with_offers_below_limit._id}`)
                        .expect(StatusCodes.OK);

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
            });

            describe("At limit", () => {

                let test_company_with_offers_at_limit;
                let offers;

                beforeAll(async () => {
                    test_company_with_offers_at_limit = await Company.create(test_company_data);

                    offers = await createTestOffers(
                        CompanyConstants.offers.max_profile_visible,
                        test_company_with_offers_at_limit
                    );
                });

                afterAll(async () => {
                    // await Offer.deleteMany({ _id: { $in: offers.map((x) => x._id) } }); prevent wasting time to compute the set of ids
                    await Offer.deleteMany({ owner: test_company_with_offers_at_limit._id });
                    await Company.deleteMany({ _id: test_company_with_offers_at_limit._id });
                });

                test("should return all offers when at limit", async () => {
                    const res = await test_agent
                        .get(`/company/${test_company_with_offers_at_limit._id}`)
                        .expect(StatusCodes.OK);

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
            });

            describe("Above limit", () => {

                let test_company_with_offers_above_limit;
                let offers;

                beforeAll(async () => {
                    test_company_with_offers_above_limit = await Company.create(test_company_data);

                    offers = await createTestOffers(
                        CompanyConstants.offers.max_profile_visible + 1,
                        test_company_with_offers_above_limit
                    );
                });

                afterAll(async () => {
                    // await Offer.deleteMany({ _id: { $in: offers.map((x) => x._id) } }); prevent wasting time to compute the set of ids
                    await Offer.deleteMany({ owner: test_company_with_offers_above_limit._id });
                    await Company.deleteMany({ _id: test_company_with_offers_above_limit._id });
                });

                test("should limit number of offers", async () => {

                    const res = await test_agent
                        .get(`/company/${test_company_with_offers_above_limit._id}`)
                        .expect(StatusCodes.OK);

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
            });
        });

        describe("With hidden offer", () => {

            let test_company_with_hidden_offer;
            let test_hidden_offer;

            beforeAll(async () => {
                test_company_with_hidden_offer = await Company.create({ ...test_company_data });

                test_hidden_offer = await Offer.create(
                    generateTestOffer({
                        isHidden: true,
                        owner: test_company_with_hidden_offer._id.toString(),
                        ownerName: test_company_with_hidden_offer.name,
                        ownerLogo: test_company_with_hidden_offer.logo,
                    })
                );
            });

            afterAll(async () => {
                await Offer.deleteMany({ _id: test_hidden_offer._id });
                await Company.deleteOne({ _id: test_company_with_hidden_offer._id });
            });


            test("should not return hidden offers", async () => {
                const res = await test_agent
                    .get(`/company/${test_company_with_hidden_offer._id}`)
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty("offers", []);
                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_with_hidden_offer._id.toString()
                );
            });
        });

        describe("With disabled company", () => {

            let test_disabled_company;

            beforeAll(async () => {
                test_disabled_company = await Company.create({ ...test_company_data, isBlocked: true });
            });

            afterAll(async () => {
                await Company.deleteOne({ _id: test_disabled_company._id });
            });

            test("should fail if company is disabled", async () => {
                const res = await test_agent
                    .get(`/company/${test_disabled_company._id}`)
                    .expect(StatusCodes.UNPROCESSABLE_ENTITY);

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
                                test_disabled_company._id
                            ),
                        }),
                    ])
                );
            });
        });

        describe("With blocked company", () => {

            let test_blocked_company;

            beforeAll(async () => {
                test_blocked_company = await Company.create({ ...test_company_data, isBlocked: true });
            });

            afterAll(async () => {
                await Company.deleteOne({ _id: test_blocked_company._id });
            });

            test("should fail if company is blocked", async () => {
                const res = await test_agent
                    .get(`/company/${test_blocked_company._id}`)
                    .expect(StatusCodes.UNPROCESSABLE_ENTITY);

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
                                test_blocked_company._id
                            ),
                        }),
                    ])
                );
            });
        });

        describe("With company that hasn't finished registration", () => {

            let test_registration_unfinished_company;

            beforeAll(async () => {
                test_registration_unfinished_company = await Company.create({ ...test_company_data, hasFinishedRegistration: false });
            });

            afterAll(async () => {
                await Company.deleteOne({ _id: test_registration_unfinished_company._id });
            });

            test("should fail if company hasn't finished registration", async () => {
                const res = await test_agent
                    .get(
                        `/company/${test_registration_unfinished_company._id}`
                    )
                    .expect(StatusCodes.UNPROCESSABLE_ENTITY);

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
                                test_registration_unfinished_company._id
                            ),
                        }),
                    ])
                );
            });
        });
    });

    describe("With Auth", () => {

        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };

        beforeAll(async () => {
            await Account.create({
                email: test_user_admin.email,
                password: await hash(test_user_admin.password),
                isAdmin: true,
            });
        });

        afterAll(async () => {
            // since we only created one account, which happens to be an admin, this should be fine
            await Account.deleteMany({ isAdmin: true });
        });

        describe("With hidden offers", () => {

            const test_user_with_hidden_offer = {
                email: "hidden@email.com",
                password: "password123",
            };

            let test_company_with_hidden_offer;
            let test_hidden_offer;

            beforeAll(async () => {
                test_company_with_hidden_offer = await Company.create({ ...test_company_data });

                await Account.create({
                    email: test_user_with_hidden_offer.email,
                    password: await hash(test_user_with_hidden_offer.password),
                    company: test_company_with_hidden_offer._id,
                });

                test_hidden_offer = await Offer.create(
                    generateTestOffer({
                        isHidden: true,
                        owner: test_company_with_hidden_offer._id.toString(),
                        ownerName: test_company_with_hidden_offer.name,
                        ownerLogo: test_company_with_hidden_offer.logo,
                    })
                );
            });

            afterAll(async () => {
                await Offer.deleteMany({ _id: test_hidden_offer._id });
                await Account.deleteOne({ email: test_user_with_hidden_offer.email });
                await Company.deleteOne({ _id: test_company_with_hidden_offer._id });
            });

            test("should return hidden offers when user is owner", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_with_hidden_offer)
                    .expect(StatusCodes.OK);

                const res = await test_agent
                    .get(`/company/${test_company_with_hidden_offer._id}`)
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty("offers", [
                    expect.objectContaining({
                        _id: test_hidden_offer._id.toString(),
                    }),
                ]);
                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_with_hidden_offer._id.toString()
                );
            });

            test("should return hidden offers when user is admin", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(StatusCodes.OK);

                const res = await test_agent
                    .get(`/company/${test_company_with_hidden_offer._id}`)
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty("offers", [
                    expect.objectContaining({
                        _id: test_hidden_offer._id.toString(),
                    }),
                ]);
                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_with_hidden_offer._id.toString()
                );
            });

            test("should return hidden offers when user is god", async () => {
                const res = await test_agent
                    .get(`/company/${test_company_with_hidden_offer._id}`)
                    .send(withGodToken())
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty("offers", expect.arrayContaining([
                    expect.objectContaining({
                        _id: test_hidden_offer._id.toString(),
                    }),
                ]));
                expect(res.body).toHaveProperty(
                    "company._id",
                    test_company_with_hidden_offer._id.toString()
                );
            });
        });

        describe("With disabled company", () => {

            const test_user_disabled_company = {
                email: "disabled@email.com",
                password: "password123",
            };

            let test_disabled_company;

            beforeAll(async () => {
                test_disabled_company = await Company.create({ ...test_company_data, isDisabled: true });

                await Account.create({
                    email: test_user_disabled_company.email,
                    password: await hash(test_user_disabled_company.password),
                    company: test_disabled_company._id,
                });
            });

            afterAll(async () => {
                await Account.deleteOne({ email: test_user_disabled_company.email });
                await Company.deleteOne({ _id: test_disabled_company._id });
            });

            test("should succeed if company is disabled and user is owner", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_disabled_company)
                    .expect(StatusCodes.OK);

                const res = await test_agent
                    .get(`/company/${test_disabled_company._id}`)
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty(
                    "company._id",
                    test_disabled_company._id.toString()
                );
            });

            test("should succeed if company is disabled and user is admin", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(StatusCodes.OK);

                const res = await test_agent
                    .get(`/company/${test_disabled_company._id}`)
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty(
                    "company._id",
                    test_disabled_company._id.toString()
                );
            });

            test("should succeed if company is disabled and user is god", async () => {
                const res = await test_agent
                    .get(`/company/${test_disabled_company._id}`)
                    .send(withGodToken())
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty(
                    "company._id",
                    test_disabled_company._id.toString()
                );
            });
        });

        describe("With blocked company", () => {

            const test_user_blocked_company = {
                email: "blocked@email.com",
                password: "password123",
            };

            let test_blocked_company;

            beforeAll(async () => {
                test_blocked_company = await Company.create({ ...test_company_data, isBlocked: true });

                await Account.create({
                    email: test_user_blocked_company.email,
                    password: await hash(test_user_blocked_company.password),
                    company: test_blocked_company._id,
                });
            });

            afterAll(async () => {
                await Account.deleteOne({ email: test_user_blocked_company.email });
                await Company.deleteOne({ _id: test_blocked_company._id });
            });

            test("should fail if company is blocked and user is owner", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_blocked_company)
                    .expect(StatusCodes.OK);

                const res = await test_agent
                    .get(`/company/${test_blocked_company._id}`)
                    .expect(StatusCodes.FORBIDDEN);

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

            test("should succeed if company is blocked and user is admin", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(StatusCodes.OK);

                const res = await test_agent
                    .get(`/company/${test_blocked_company._id}`)
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty(
                    "company._id",
                    test_blocked_company._id.toString()
                );
            });

            test("should succeed if company is blocked and user is god", async () => {
                const res = await test_agent
                    .get(`/company/${test_blocked_company._id}`)
                    .send(withGodToken())
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty(
                    "company._id",
                    test_blocked_company._id.toString()
                );
            });
        });

        describe("With company that hasn't finished registration", () => {

            const test_user_with_unfinished_registration = {
                email: "unfinished@email.com",
                password: "password123",
            };

            let test_registration_unfinished_company;

            beforeAll(async () => {
                test_registration_unfinished_company = await Company.create({ ...test_company_data, hasFinishedRegistration: false });

                await Account.create({
                    email: test_user_with_unfinished_registration.email,
                    password: await hash(test_user_with_unfinished_registration.password),
                    company: test_registration_unfinished_company._id,
                });
            });

            afterAll(async () => {
                await Account.deleteOne({ email: test_user_with_unfinished_registration.email });
                await Company.deleteOne({ _id: test_registration_unfinished_company._id });
            });

            test("should fail if company hasn't finished registration and user is owner", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_with_unfinished_registration)
                    .expect(StatusCodes.OK);

                const res = await test_agent
                    .get(
                        `/company/${test_registration_unfinished_company._id}`
                    )
                    .expect(StatusCodes.FORBIDDEN);

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

            test("should fail if company hasn't finished registration and user is admin", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(StatusCodes.OK);

                const res = await test_agent
                    .get(
                        `/company/${test_registration_unfinished_company._id}`
                    )
                    .expect(StatusCodes.FORBIDDEN);

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

            test("should fail if company hasn't finished registration and user is god", async () => {
                const res = await test_agent
                    .get(
                        `/company/${test_registration_unfinished_company._id}`
                    )
                    .send(withGodToken())
                    .expect(StatusCodes.FORBIDDEN);

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
});
