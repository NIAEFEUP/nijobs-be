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
import ValidatorTester from "../../../utils/ValidatorTester";

describe("GET /company/:companyId/hasReachedMaxConcurrentOffersBetweenDates", () => {

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

    const publishDate = (new Date(Date.now())).toISOString();
    const publishEndDate = (new Date(Date.now() + (2 * DAY_TO_MS))).toISOString();

    beforeAll(async () => {
        await Account.deleteMany({});

        await Account.create({
            email: test_user_admin.email,
            password: await hash(test_user_admin.password),
            isAdmin: true
        });

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

    beforeEach(async () => {
        await test_agent
            .delete("/auth/login")
            .expect(StatusCodes.OK);
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
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining(
                [
                    expect.objectContaining({
                        param: "companyId",
                        msg: ValidationReasons.OBJECT_ID
                    })
                ]
            ));
        });

        test("Should fail if company does not exist", async () => {

            const id = "111111111111111111111111";
            const res = await test_agent
                .get(`/company/${id}/hasReachedMaxConcurrentOffersBetweenDates`)
                .send(withGodToken({ publishDate, publishEndDate }))
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    param: "companyId",
                    msg: ValidationReasons.COMPANY_NOT_FOUND(id)
                })
            ]));
        });
    });

    describe("Input validation", () => {

        const testValidationUser = {
            email: "validation@email.com",
            password: "password123",
        };
        let validationTestCompany;
        const testValidationCompanyData = {
            name: "validation-test-company",
            hasFinishedRegistration: true
        };

        const EndpointValidatorTester = ValidatorTester(
            (params) => test_agent.get(`/company/${validationTestCompany._id}/hasReachedMaxConcurrentOffersBetweenDates`).send(params)
        );
        const BodyValidatorTester = EndpointValidatorTester("body");

        beforeAll(async () => {
            validationTestCompany = await Company.create(testValidationCompanyData);

            await Account.create({
                email: testValidationUser.email,
                password: await hash(testValidationUser.password),
                company: validationTestCompany._id
            });
        });

        afterAll(async () => {
            await Account.deleteMany({ email: testValidationUser.email });
            await Company.deleteMany({ name: testValidationCompanyData.name });
        });

        beforeEach(async () => {
            await test_agent
                .post("/auth/login")
                .send(testValidationUser)
                .expect(StatusCodes.OK);
        });

        describe("publishDate", () => {
            const FieldValidatorTester = BodyValidatorTester("publishDate");
            FieldValidatorTester.mustBeDate();
        });

        describe("publishEndDate", () => {
            const FieldValidatorTester = BodyValidatorTester("publishEndDate");
            FieldValidatorTester.mustBeDate();
            FieldValidatorTester.mustBeAfter("publishDate");
        });
    });

    describe("Auth", () => {
        test("Should fail if not logged in", async () => {

            const res = await test_agent
                .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                .send({ publishDate, publishEndDate })
                .expect(StatusCodes.UNAUTHORIZED);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            // TODO: change to use expect's helpers
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INSUFFICIENT_PERMISSIONS);
        });

        test("Should fail if logged as a different company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                .send({ publishDate, publishEndDate })
                .expect(StatusCodes.FORBIDDEN);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INSUFFICIENT_PERMISSIONS_COMPANY_SETTINGS);
        });

        test("Should succeed if god token is sent", async () => {

            const res = await test_agent
                .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                .send(withGodToken({ publishDate, publishEndDate }))
                .expect(StatusCodes.OK);

            expect(res.body).toHaveProperty("maxOffersReached", false);
        });

        test("Should succeed if logged as an admin", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                .send({ publishDate, publishEndDate })
                .expect(StatusCodes.OK);

            expect(res.body).toHaveProperty("maxOffersReached", false);
        });

        test("Should succeed if logged as the same company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_1)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
                .send({ publishDate, publishEndDate })
                .expect(StatusCodes.OK);

            expect(res.body).toHaveProperty("maxOffersReached", false);
        });
    });

    test("Should succeed if publishDate is not specified", async () => {

        const res = await test_agent
            .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
            .send(withGodToken({ publishEndDate }))
            .expect(StatusCodes.OK);

        expect(res.body).toHaveProperty("maxOffersReached", false);
    });

    test("Should succeed if publishEndDate is not specified", async () => {

        const res = await test_agent
            .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
            .send(withGodToken({ publishDate }))
            .expect(StatusCodes.OK);

        expect(res.body).toHaveProperty("maxOffersReached", false);
    });

    test("Should succeed if neither publishDate or publishEndDate are specified", async () => {

        const res = await test_agent
            .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
            .send(withGodToken())
            .expect(StatusCodes.OK);

        expect(res.body).toHaveProperty("maxOffersReached", false);
    });

    test("Should fail if publishDate is after publishEndDate", async () => {

        const res = await test_agent
            .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
            .send(withGodToken({
                publishDate: publishEndDate,
                publishEndDate: publishDate,
            }))
            .expect(StatusCodes.UNPROCESSABLE_ENTITY);

        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors[0]).toHaveProperty("param", "publishEndDate");
        expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.MUST_BE_AFTER("publishDate"));
    });

    test("Should fail if publishDate doesn't have a date format", async () => {

        const res = await test_agent
            .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
            .send(withGodToken({ publishDate: "123", publishEndDate }))
            .expect(StatusCodes.UNPROCESSABLE_ENTITY);

        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors[0]).toHaveProperty("param", "publishDate");
        expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.DATE);
    });

    test("Should fail if publishEndDate doesn't have a date format", async () => {

        const res = await test_agent
            .get(`/company/${test_company_1._id}/hasReachedMaxConcurrentOffersBetweenDates`)
            .send(withGodToken({ publishDate, publishEndDate: "123" }))
            .expect(StatusCodes.UNPROCESSABLE_ENTITY);

        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors[0]).toHaveProperty("param", "publishEndDate");
        expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.DATE);
    });

    test("Should return true if the company has reached max offers in the time interval", async () => {

        await test_agent
            .post("/auth/login")
            .send(test_user_company_2)
            .expect(StatusCodes.OK);

        const res = await test_agent
            .get(`/company/${test_company_2._id}/hasReachedMaxConcurrentOffersBetweenDates`)
            .send({ publishDate, publishEndDate })
            .expect(StatusCodes.OK);

        expect(res.body).toHaveProperty("maxOffersReached", true);
    });
});
