import { StatusCodes } from "http-status-codes";
import { ErrorTypes } from "../../../../src/api/middleware/errorHandler";
import ValidationReasons from "../../../../src/api/middleware/validators/validationReasons";
import { COMPANY_DELETED_NOTIFICATION } from "../../../../src/email-templates/companyManagement";
import EmailService, { EmailService as EmailServiceClass } from "../../../../src/lib/emailService";
import hash from "../../../../src/lib/passwordHashing";
import Account from "../../../../src/models/Account";
import Company from "../../../../src/models/Company";
import Offer from "../../../../src/models/Offer";
import withGodToken from "../../../utils/GodToken";
import { DAY_TO_MS } from "../../../utils/TimeConstants";
jest.mock("../../../../src/lib/emailService");
jest.spyOn(EmailServiceClass.prototype, "verifyConnection").mockImplementation(() => Promise.resolve());

describe("POST /company/:companyId/delete", () => {

    const test_agent = agent();

    beforeAll(async () => {
        await Company.deleteMany({});
        await Account.deleteMany({});
        await Offer.deleteMany({});
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
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    "param": "companyId",
                    "msg": ValidationReasons.OBJECT_ID,
                })
            ]));
        });

        test("Should fail if company does not exist", async () => {

            const id = "111111111111111111111111";
            const res = await test_agent
                .post(`/company/${id}/delete`)
                .send(withGodToken())
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    "param": "companyId",
                    "msg": ValidationReasons.COMPANY_NOT_FOUND(id),
                })
            ]));
        });
    });

    describe("Without auth", () => {

        let test_company;

        const companyData = {
            name: "Test Company",
            hasFinishedRegistration: true
        };

        beforeAll(async () => {
            test_company = await Company.create(companyData);
        });

        afterAll(async () => {
            await Company.deleteMany({ _id: test_company._id });
        });

        test("should fail to delete company if not logged", async () => {

            const res = await test_agent
                .post(`/company/${test_company._id}/delete`)
                .expect(StatusCodes.UNAUTHORIZED);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                { // use an object literal since we are expecting an exact match
                    "msg": ValidationReasons.INSUFFICIENT_PERMISSIONS,
                }
            ]));
        });
    });

    describe("With auth", () => {

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

        let test_company_1, test_company_2, test_company_offers, test_company_mail;

        const test_user_company_1 = {
            email: "company1@email.com",
            password: "password123",
        };
        const test_user_company_2 = {
            email: "company2@email.com",
            password: "password123",
        };
        const test_user_company_offers = {
            email: "offers@email.com",
            password: "password123",
        };
        const test_user_company_mail = {
            email: "email@email.com",
            password: "password123",
        };
        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };

        beforeAll(async () => {
            [test_company_1, test_company_2, test_company_offers, test_company_mail] = await Company.create([
                {
                    name: "test-company-1",
                    hasFinishedRegistration: true
                },
                {
                    name: "test-company-2",
                    hasFinishedRegistration: true,
                },
                {
                    name: "test-company-offers",
                    hasFinishedRegistration: true,
                    logo: "https://test.com/logo.png",
                },
                {
                    name: "test-company-mail",
                    hasFinishedRegistration: true,
                }
            ]);

            await Account.create([
                {
                    email: test_user_company_1.email,
                    password: await hash(test_user_company_1.password),
                    company: test_company_1._id
                },
                {
                    email: test_user_company_2.email,
                    password: await hash(test_user_company_2.password),
                    company: test_company_2._id
                },
                {
                    email: test_user_company_offers.email,
                    password: await hash(test_user_company_offers.password),
                    company: test_company_offers._id
                },
                {
                    email: test_user_company_mail.email,
                    password: await hash(test_user_company_mail.password),
                    company: test_company_mail._id
                }
            ]);

            await Account.create({
                email: test_user_admin.email,
                password: await hash(test_user_admin.password),
                isAdmin: true
            });

            const offer = generateTestOffer({
                owner: test_company_offers._id,
                ownerName: test_company_offers.name,
                ownerLogo: test_company_offers.logo,
            });

            await Offer.create([offer, offer]);
        });

        afterAll(async () => {
            await Company.deleteMany({ _id: test_company_1._id });
            await Company.deleteMany({ _id: test_company_2._id });
            await Company.deleteMany({ _id: test_company_offers._id });
            await Company.deleteMany({ _id: test_company_mail._id });
            await Account.deleteMany({ email: test_user_company_1.email });
            await Account.deleteMany({ email: test_user_company_2.email });
            await Account.deleteMany({ email: test_user_company_offers.email });
            await Account.deleteMany({ email: test_user_company_mail.email });
            await Account.deleteMany({ email: test_user_admin.email });
            await Offer.deleteMany({});
        });

        afterEach(async () => {
            await test_agent
                .delete("/auth/login")
                .expect(StatusCodes.OK);
        });

        test("should fail to delete company if logged as different company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .post(`/company/${test_company_1._id}/delete`)
                .expect(StatusCodes.FORBIDDEN);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                {
                    "msg": ValidationReasons.INSUFFICIENT_PERMISSIONS_COMPANY_SETTINGS,
                }
            ]));
        });

        test("should fail to delete company if logged as admin", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .post(`/company/${test_company_1._id}/delete`)
                .expect(StatusCodes.UNAUTHORIZED);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                {
                    "msg": ValidationReasons.INSUFFICIENT_PERMISSIONS,
                }
            ]));
        });

        test("Should delete company if god token is sent", async () => {

            await test_agent
                .post(`/company/${test_company_1._id}/delete`)
                .send(withGodToken())
                .expect(StatusCodes.OK);

            expect(await Company.exists({ _id: test_company_1._id })).toBeNull();
            expect(await Account.exists({ company: test_company_1._id })).toBeNull();
        });

        test("Should delete company if logged as the same company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(StatusCodes.OK);

            await test_agent
                .post(`/company/${test_company_2._id}/delete`)
                .expect(StatusCodes.OK);

            expect(await Company.exists({ _id: test_company_2._id })).toBeNull();
            expect(await Account.exists({ company: test_company_2._id })).toBeNull();
        });

        test("Should delete company's offers when it is deleted", async () => {
            expect(await Offer.exists({ owner: test_company_offers._id })).not.toBeNull();

            await test_agent
                .post(`/company/${test_company_offers._id}/delete`)
                .send(withGodToken())
                .expect(StatusCodes.OK);

            expect(await Company.exists({ _id: test_company_offers._id })).toBeNull();
            expect(await Account.exists({ company: test_company_offers._id })).toBeNull();
            expect(await Offer.exists({ owner: test_company_offers._id })).toBeNull();
        });

        test("should send an email to the company user when it is deleted", async () => {
            await test_agent
                .post(`/company/${test_company_mail._id}/delete`)
                .send(withGodToken())
                .expect(StatusCodes.OK);

            const emailOptions = COMPANY_DELETED_NOTIFICATION(
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
});
