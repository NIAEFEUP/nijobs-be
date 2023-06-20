import { StatusCodes } from "http-status-codes";
import { ErrorTypes } from "../../../../src/api/middleware/errorHandler";
import ValidationReasons from "../../../../src/api/middleware/validators/validationReasons";
import hash from "../../../../src/lib/passwordHashing";
import Account from "../../../../src/models/Account";
import Company from "../../../../src/models/Company";
import Offer from "../../../../src/models/Offer";
import OfferConstants from "../../../../src/models/constants/Offer";
import { COMPANY_BLOCKED_NOTIFICATION } from "../../../../src/email-templates/companyManagement";
import { DAY_TO_MS } from "../../../utils/TimeConstants";
import withGodToken from "../../../utils/GodToken";
import EmailService, { EmailService as EmailServiceClass } from "../../../../src/lib/emailService";

jest.mock("../../../../src/lib/emailService");
jest.spyOn(EmailServiceClass.prototype, "verifyConnection").mockImplementation(() => Promise.resolve());

describe("PUT /company/block", () => {

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
            .expect(StatusCodes.UNAUTHORIZED);
        expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INSUFFICIENT_PERMISSIONS);
    });

    test("should fail if logged in as company", async () => {
        await test_agent
            .post("/auth/login")
            .send(test_users[1])
            .expect(StatusCodes.OK);

        const res = await test_agent
            .put(`/company/${test_company_1.id}/block`)
            .expect(StatusCodes.UNAUTHORIZED);
        expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INSUFFICIENT_PERMISSIONS);
    });


    test("should fail if admin reason not provided", async () => {
        await test_agent
            .post("/auth/login")
            .send(test_user_admin)
            .expect(StatusCodes.OK);

        const res = await test_agent
            .put(`/company/${test_company_1.id}/block`)
            .expect(StatusCodes.UNPROCESSABLE_ENTITY);
        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors[0]).toHaveProperty("param", "adminReason");
        expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.REQUIRED);
    });

    test("should allow if logged in as admin", async () => {
        await test_agent
            .post("/auth/login")
            .send(test_user_admin)
            .expect(StatusCodes.OK);

        const res = await test_agent
            .put(`/company/${test_company_1.id}/block`)
            .send({ adminReason })
            .expect(StatusCodes.OK);
        expect(res.body).toHaveProperty("isBlocked", true);
        expect(res.body).toHaveProperty("adminReason", adminReason);
    });

    test("should fail if not a valid id", async () => {
        await test_agent
            .post("/auth/login")
            .send(test_user_admin)
            .expect(StatusCodes.OK);

        const res = await test_agent
            .put("/company/123/block")
            .send({ adminReason })
            .expect(StatusCodes.UNPROCESSABLE_ENTITY);
        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors[0]).toHaveProperty("param", "companyId");
        expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.OBJECT_ID);
    });

    test("should fail if company does not exist", async () => {
        await test_agent
            .post("/auth/login")
            .send(test_user_admin)
            .expect(StatusCodes.OK);

        const id = "111111111111111111111111";
        const res = await test_agent
            .put(`/company/${id}/block`)
            .send({ adminReason })
            .expect(StatusCodes.UNPROCESSABLE_ENTITY);

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
            .expect(StatusCodes.OK);
        expect(res.body).toHaveProperty("isBlocked", true);
        expect(res.body).toHaveProperty("adminReason", adminReason);
    });

    test("should send an email to the company user when it is blocked", async () => {
        await test_agent
            .del("/auth/login");
        await test_agent
            .put(`/company/${test_email_company._id}/block`)
            .send(withGodToken({ adminReason }))
            .expect(StatusCodes.OK);

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
                company: test_company._id
            });

            await Account.create({
                email: test_user_admin.email,
                password: await hash(test_user_admin.password),
                isAdmin: true
            });
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(StatusCodes.OK);
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
                .expect(StatusCodes.OK);
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
                .expect(StatusCodes.OK);
            expect(res.body).toHaveProperty("isBlocked", true);
            expect(res.body).toHaveProperty("adminReason", adminReason);


            const updated_offer = await Offer.findById(offer._id);

            expect(updated_offer).toHaveProperty("hiddenReason", OfferConstants.HiddenOfferReasons.ADMIN_BLOCK);
            expect(updated_offer).toHaveProperty("isHidden", true);

        });
    });
});
