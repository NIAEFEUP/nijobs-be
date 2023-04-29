import { StatusCodes } from "http-status-codes";
import { ErrorTypes } from "../../../../src/api/middleware/errorHandler";
import ValidationReasons from "../../../../src/api/middleware/validators/validationReasons";
import { COMPANY_UNBLOCKED_NOTIFICATION } from "../../../../src/email-templates/companyManagement";
import EmailService, { EmailService as EmailServiceClass } from "../../../../src/lib/emailService";
import hash from "../../../../src/lib/passwordHashing";
import Account from "../../../../src/models/Account";
import Company from "../../../../src/models/Company";
import Offer from "../../../../src/models/Offer";
import OfferConstants from "../../../../src/models/constants/Offer";
import withGodToken from "../../../utils/GodToken";
import { DAY_TO_MS } from "../../../utils/TimeConstants";

jest.mock("../../../../src/lib/emailService");
jest.spyOn(EmailServiceClass.prototype, "verifyConnection").mockImplementation(() => Promise.resolve());

describe("PUT /company/:companyId/unblock", () => {
    const test_agent = agent();

    beforeAll(async () => {
        await Company.deleteMany({});
        await Account.deleteMany({});
        await Offer.deleteMany({});
    });

    afterAll(async () => {
        await Company.deleteMany({});
        await Account.deleteMany({});
        await Offer.deleteMany({});
    });

    describe("ID Validation", () => {
        test("should fail if not a valid id", async () => {
            const res = await test_agent
                .put("/company/123/unblock")
                .send(withGodToken())
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    param: "companyId",
                    msg: ValidationReasons.OBJECT_ID
                })
            ]));
        });

        test("should fail if company does not exist", async () => {
            const id = "111111111111111111111111";

            const res = await test_agent
                .put(`/company/${id}/unblock`)
                .send(withGodToken())
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

    describe("Without auth", () => {

        const test_user = {
            email: "email@email.com",
            password: "password123",
        };
        const test_company_data = {
            name: "Company Ltd",
            hasFinishedRegistration: true,
            isBlocked: true
        };

        let test_company;

        beforeAll(async () => {
            test_company = await Company.create(test_company_data);

            await Account.create({
                email: test_user.email,
                password: await hash(test_user.password),
                company: test_company._id
            });
        });

        afterAll(async () => {
            await Account.deleteMany({ email: test_user.email });
            await Company.deleteMany({ _id: test_company._id });
        });

        test("should fail if not logged in", async () => {
            await test_agent
                .del("/auth/login");

            const res = await test_agent
                .put(`/company/${test_company.id}/unblock`)
                .expect(StatusCodes.UNAUTHORIZED);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    msg: ValidationReasons.INSUFFICIENT_PERMISSIONS
                })
            ]));
        });
    });

    describe("With auth", () => {

        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };

        const test_user_1 = {
            email: "company1@email.com",
            password: "password123",
        };
        const test_company_1_data = {
            name: "Company Ltd",
            hasFinishedRegistration: true,
            isBlocked: true
        };

        const test_user_2 = {
            email: "company2@email.com",
            password: "password123",
        };
        const test_company_2_data = {
            name: "Company Ltd",
            hasFinishedRegistration: true,
            isBlocked: true
        };

        const test_user_email = {
            email: "companyemail@email.com",
            password: "password123",
        };
        const test_company_email_data = {
            name: "Company Ltd",
            hasFinishedRegistration: true,
            isBlocked: true
        };

        let test_company_1, test_company_2, test_company_email;

        beforeAll(async () => {
            await Account.create({
                email: test_user_admin.email,
                password: await hash(test_user_admin.password),
                isAdmin: true
            });

            [
                test_company_1,
                test_company_2,
                test_company_email,
            ] = await Company.create([
                test_company_1_data,
                test_company_2_data,
                test_company_email_data,
            ]);

            await Account.create([
                {
                    email: test_user_1.email,
                    password: await hash(test_user_1.password),
                    company: test_company_1._id
                },
                {
                    email: test_user_2.email,
                    password: await hash(test_user_2.password),
                    company: test_company_2._id
                },
                {
                    email: test_user_email.email,
                    password: await hash(test_user_email.password),
                    company: test_company_email._id
                }
            ]);
        });

        afterAll(async () => {
            await Account.deleteMany({ email: test_user_admin.email });
            await Account.deleteMany({ email: test_user_1.email });
            await Account.deleteMany({ email: test_user_2.email });

            await Company.deleteMany({ name: test_company_1_data.name });
            await Company.deleteMany({ name: test_company_2_data.name });
        });

        afterEach(async () => {
            await test_agent
                .del("/auth/login")
                .expect(StatusCodes.OK);
        });

        test("should fail if logged in as company", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_1)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .put(`/company/${test_company_1.id}/unblock`)
                .expect(StatusCodes.UNAUTHORIZED);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    msg: ValidationReasons.INSUFFICIENT_PERMISSIONS
                })
            ]));
        });

        test("should allow if logged in as admin", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .put(`/company/${test_company_1.id}/unblock`)
                .expect(StatusCodes.OK);

            expect(res.body).toHaveProperty("isBlocked", false);
            expect(res.body).not.toHaveProperty("adminReason");
        });

        test("should allow with god token", async () => {
            const res = await test_agent
                .put(`/company/${test_company_2.id}/unblock`)
                .send(withGodToken())
                .expect(StatusCodes.OK);

            expect(res.body).toHaveProperty("isBlocked", false);
        });

        test("should send an email to the company user when it is unblocked", async () => {

            await test_agent
                .put(`/company/${test_company_email._id}/unblock`)
                .send(withGodToken())
                .expect(StatusCodes.OK);

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

        describe("With offers", () => {

            const companyData = {
                name: "Company Ltd",
                hasFinishedRegistration: true,
                isBlocked: true,
                logo: "http://logo.com/alogo.png"
            };

            const test_user_with_company_hidden_offer = {
                email: "with_company_hidden_offer@email.com",
                password: "password123",
            };

            const test_user_with_admin_hidden_offer = {
                email: "with_admin_hidden_offer@email.com",
                password: "password123",
            };

            const test_user_with_blocked_company_hidden_offer = {
                email: "with_blocked_company_hidden_offer@email.com",
                password: "password123",
            };

            let company_with_company_hidden_offer, company_with_admin_hidden_offer, company_with_blocked_company_hidden_offer;

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
                isHidden: true,
                requirements: ["The candidate must be tested", "Fluent in testJS"],
                ...params,
            });

            beforeAll(async () => {
                [
                    company_with_company_hidden_offer,
                    company_with_admin_hidden_offer,
                    company_with_blocked_company_hidden_offer
                ] = await Company.create([
                    companyData,
                    companyData,
                    companyData,
                ]);

                await Account.create([
                    {
                        email: test_user_with_company_hidden_offer.email,
                        password: await hash(test_user_with_company_hidden_offer.password),
                        company: company_with_company_hidden_offer._id
                    },
                    {
                        email: test_user_with_admin_hidden_offer.email,
                        password: await hash(test_user_with_admin_hidden_offer.password),
                        company: company_with_admin_hidden_offer._id
                    },
                    {
                        email: test_user_with_blocked_company_hidden_offer.email,
                        password: await hash(test_user_with_blocked_company_hidden_offer.password),
                        company: company_with_blocked_company_hidden_offer._id
                    }
                ]);

                await Offer.create(
                    generateTestOffer({
                        owner: company_with_company_hidden_offer._id,
                        ownerName: company_with_company_hidden_offer.name,
                        ownerLogo: company_with_company_hidden_offer.logo,
                        hiddenReason: OfferConstants.HiddenOfferReasons.COMPANY_REQUEST
                    })
                );

                await Offer.create(
                    generateTestOffer({
                        owner: company_with_admin_hidden_offer._id,
                        ownerName: company_with_admin_hidden_offer.name,
                        ownerLogo: company_with_admin_hidden_offer.logo,
                        hiddenReason: OfferConstants.HiddenOfferReasons.ADMIN_BLOCK
                    })
                );

                await Offer.create(
                    generateTestOffer({
                        owner: company_with_blocked_company_hidden_offer._id,
                        ownerName: company_with_blocked_company_hidden_offer.name,
                        ownerLogo: company_with_blocked_company_hidden_offer.logo,
                        hiddenReason: OfferConstants.HiddenOfferReasons.COMPANY_BLOCKED
                    })
                );
            });

            afterAll(async () => {
                await Company.deleteMany({ name: companyData.name });

                await Account.deleteMany({ email: test_user_with_company_hidden_offer.email });
                await Account.deleteMany({ email: test_user_with_admin_hidden_offer.email });
                await Account.deleteMany({ email: test_user_with_blocked_company_hidden_offer.email });

                await Offer.deleteMany({ owner: company_with_company_hidden_offer._id });
                await Offer.deleteMany({ owner: company_with_admin_hidden_offer._id });
                await Offer.deleteMany({ owner: company_with_blocked_company_hidden_offer._id });
            });

            test("should unblock offers blocked by company block", async () => {
                const res = await test_agent
                    .put(`/company/${company_with_blocked_company_hidden_offer.id}/unblock`)
                    .send(withGodToken())
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty("isBlocked", false);

                const offers = await Offer.find({ owner: company_with_blocked_company_hidden_offer._id });
                expect(offers).not.toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        isHidden: true,
                    })
                ]));
            });

            test("should not unblock offers hidden by admin request", async () => {
                const res = await test_agent
                    .put(`/company/${company_with_admin_hidden_offer.id}/unblock`)
                    .send(withGodToken())
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty("isBlocked", false);

                const offers = await Offer.find({ owner: company_with_admin_hidden_offer._id });
                expect(offers).not.toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        isHidden: false,
                    })
                ]));
            });

            test("should not unblock offers blocked by company request", async () => {
                const res = await test_agent
                    .put(`/company/${company_with_company_hidden_offer.id}/unblock`)
                    .send(withGodToken())
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty("isBlocked", false);

                const offers = await Offer.find({ owner: company_with_company_hidden_offer._id });
                expect(offers).not.toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        isHidden: false,
                    })
                ]));
            });
        });
    });
});
