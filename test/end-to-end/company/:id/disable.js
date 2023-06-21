import { StatusCodes } from "http-status-codes";
import { ErrorTypes } from "../../../../src/api/middleware/errorHandler";
import ValidationReasons from "../../../../src/api/middleware/validators/validationReasons";
import { COMPANY_DISABLED_NOTIFICATION } from "../../../../src/email-templates/companyManagement";
import hash from "../../../../src/lib/passwordHashing";
import Account from "../../../../src/models/Account";
import Company from "../../../../src/models/Company";
import Offer from "../../../../src/models/Offer";
import OfferConstants from "../../../../src/models/constants/Offer";
import withGodToken from "../../../utils/GodToken";
import { DAY_TO_MS } from "../../../utils/TimeConstants";
import EmailService, { EmailService as EmailServiceClass } from "../../../../src/lib/emailService";

jest.mock("../../../../src/lib/emailService");
jest.spyOn(EmailServiceClass.prototype, "verifyConnection").mockImplementation(() => Promise.resolve());

describe("PUT /company/disable", () => {

    const test_agent = agent();

    beforeAll(async () => {
        await Company.deleteMany({});
        await Offer.deleteMany({});
        await Account.deleteMany({});
    });

    afterAll(async () => {
        await Company.deleteMany({});
        await Offer.deleteMany({});
        await Account.deleteMany({});
    });

    describe("ID Validation", () => {
        test("Should fail if id is not a valid ObjectID", async () => {
            const id = "123";
            const res = await test_agent
                .put(`/company/${id}/disable`)
                .send(withGodToken())
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    "location": "params",
                    "msg": ValidationReasons.OBJECT_ID,
                    "param": "companyId",
                    "value": id
                })
            ]));
        });

        test("Should fail if id is not a valid company", async () => {
            const id = "111111111111111111111111";

            const res = await test_agent
                .put(`/company/${id}/disable`)
                .send(withGodToken())
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    "location": "params",
                    "msg": ValidationReasons.COMPANY_NOT_FOUND(id),
                    "param": "companyId",
                    "value": id
                })
            ]));
        });
    });

    describe("Without auth", () => {

        let company;
        const company_data = {
            name: "test-company-no-auth",
            hasFinishedRegistration: true
        };

        beforeAll(async () => {
            company = await Company.create(company_data);
        });

        afterAll(async () => {
            await Company.deleteMany({ name: company_data.name });
        });

        test("Should not disable company if not authenticated", async () => {
            const res = await test_agent
                .put(`/company/${company._id}/disable`)
                .expect(StatusCodes.UNAUTHORIZED);

            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    "msg": ValidationReasons.INSUFFICIENT_PERMISSIONS
                })
            ]));
        });
    });

    describe("With auth", () => {

        let test_company_1, test_company_2, test_company_mail;
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

        const test_user_company_mail = {
            email: "company_mail@email.com",
            password: "password123",
        };

        beforeAll(async () => {
            [test_company_1, test_company_2, test_company_mail] = await Company.create([
                {
                    name: "test-company-1",
                    hasFinishedRegistration: true
                }, {
                    name: "test-company-2",
                    hasFinishedRegistration: true
                }, {
                    name: "test-company-main",
                    hasFinishedRegistration: true
                }
            ]);

            await Account.create([
                {
                    email: test_user_admin.email,
                    password: await hash(test_user_admin.password),
                    isAdmin: true
                }, {
                    email: test_user_company_1.email,
                    password: await hash(test_user_company_1.password),
                    company: test_company_1._id
                }, {
                    email: test_user_company_2.email,
                    password: await hash(test_user_company_2.password),
                    company: test_company_2._id
                }, {
                    email: test_user_company_mail.email,
                    password: await hash(test_user_company_mail.password),
                    company: test_company_mail._id
                }
            ]);
        });

        afterAll(async () => {
            await Company.deleteMany({ name: { $in: [test_company_1._id, test_company_2._id] } });
            await Account.deleteMany({
                email: {
                    $in: [
                        test_user_admin.email,
                        test_user_company_1.email,
                        test_user_company_2.email,
                        test_user_company_mail.email
                    ]
                }
            });
        });

        afterEach(async () => {
            await test_agent
                .delete("/auth/login")
                .expect(StatusCodes.OK);
        });

        test("should fail to disable company if logged as different company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .put(`/company/${test_company_1._id}/disable`)
                .expect(StatusCodes.FORBIDDEN);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    "msg": ValidationReasons.INSUFFICIENT_PERMISSIONS_COMPANY_SETTINGS
                })
            ]));
        });

        test("should fail to disable company if logged as admin", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .put(`/company/${test_company_1._id}/disable`)
                .expect(StatusCodes.UNAUTHORIZED);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    "msg": ValidationReasons.INSUFFICIENT_PERMISSIONS
                })
            ]));
        });

        test("Should disable company if god token is sent", async () => {

            const res = await test_agent
                .put(`/company/${test_company_2._id}/disable`)
                .send(withGodToken());

            expect(res.status).toBe(StatusCodes.OK);
            expect(res.body.isDisabled).toBe(true);
        });

        test("Should disable company if logged as same company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_1)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .put(`/company/${test_company_1._id}/disable`);

            expect(res.status).toBe(StatusCodes.OK);
            expect(res.body.isDisabled).toBe(true);
        });

        describe("With offers", () => {
            const assertOfferList = (offers, expectedIsHidden, expectedHiddenReason) => {
                expect(offers).not.toEqual(expect.arrayContaining([
                    expect.objectContaining({
                        isHidden: !expectedIsHidden,
                        hiddenReason: !expectedHiddenReason
                    })
                ]));
            };

            let company_with_offers;
            const company_with_offers_data = {
                name: "test-company-with-offers",
                logo: "http://awebsite.com/alogo.jpg",
                hasFinishedRegistration: true
            };
            const account_with_offers_data = {
                email: "withOffers@mail.com",
                password: "password123",
            };

            beforeAll(async () => {
                company_with_offers = await Company.create(company_with_offers_data);
                await Account.create({
                    email: account_with_offers_data.email,
                    password: await hash(account_with_offers_data.password),
                    company: company_with_offers._id
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
                    owner: company_with_offers._id,
                    ownerName: company_with_offers.name,
                    ownerLogo: company_with_offers.logo,
                };

                await Offer.create([offer, offer]);
            });

            afterAll(async () => {
                await Account.deleteMany({ email: account_with_offers_data.email });
                await Company.deleteMany({ name: company_with_offers_data.name });
                await Offer.deleteMany({ owner: company_with_offers._id });
            });

            test("should change offers' 'isHidden' on company disable", async () => {

                const offersBefore = await Offer.find({ owner: company_with_offers._id });

                assertOfferList(offersBefore, false, undefined);

                const res = await test_agent
                    .put(`/company/${company_with_offers._id}/disable`)
                    .send(withGodToken());

                expect(res.status).toBe(StatusCodes.OK);
                expect(res.body.isDisabled).toBe(true);

                const offersAfter = await Offer.find({ owner: company_with_offers._id });

                assertOfferList(offersAfter, true, OfferConstants.HiddenOfferReasons.COMPANY_DISABLED);
            });
        });

        test("should send an email to the company user when it is disabled", async () => {
            await test_agent
                .put(`/company/${test_company_mail._id}/disable`)
                .send(withGodToken())
                .expect(StatusCodes.OK);

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
});
