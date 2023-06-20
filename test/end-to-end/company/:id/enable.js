import { StatusCodes } from "http-status-codes";
import Company from "../../../../src/models/Company";
import Offer from "../../../../src/models/Offer";
import OfferConstants from "../../../../src/models/constants/Offer";
import Account from "../../../../src/models/Account";
import hash from "../../../../src/lib/passwordHashing";
import ValidationReasons from "../../../../src/api/middleware/validators/validationReasons";
import { ErrorTypes } from "../../../../src/api/middleware/errorHandler";
import withGodToken from "../../../utils/GodToken";
import { COMPANY_ENABLED_NOTIFICATION } from "../../../../src/email-templates/companyManagement";
import { DAY_TO_MS } from "../../../utils/TimeConstants";
import EmailService, { EmailService as EmailServiceClass } from "../../../../src/lib/emailService";

jest.mock("../../../../src/lib/emailService");
jest.spyOn(EmailServiceClass.prototype, "verifyConnection").mockImplementation(() => Promise.resolve());

describe("PUT /company/enable", () => {

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

    describe("Id validation", () => {
        test("Should fail if using invalid id", async () => {
            const res = await test_agent
                .put("/company/123/enable")
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

        test("Should fail if company does not exist", async () => {
            const id = "111111111111111111111111";
            const res = await test_agent
                .put(`/company/${id}/enable`)
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

        let disabled_company;
        const disabled_company_data = {
            name: "disabled-company",
            isDisabled: true,
            hasFinishedRegistration: true
        };

        beforeAll(async () => {
            disabled_company = await Company.create(disabled_company_data);
        });

        afterAll(async () => {
            await Company.deleteMany({ name: disabled_company_data.name });
        });

        test("should fail to enable if not logged", async () => {

            const res = await test_agent
                .put(`/company/${disabled_company._id}/enable`)
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

        let disabled_test_company_1, disabled_test_company_2, disabled_test_company_3, disabled_test_company_mail;

        const disabled_test_company_1_data = {
            name: "disabled-test-company-1",
            isDisabled: true,
            hasFinishedRegistration: true
        };
        const disabled_test_company_2_data = {
            name: "disabled-test-company-2",
            isDisabled: true,
            hasFinishedRegistration: true
        };
        const disabled_test_company_3_data = {
            name: "disabled-test-company-3",
            isDisabled: true,
            hasFinishedRegistration: true
        };
        const disabled_test_company_mail_data = {
            name: "disabled-test-company-mail",
            isDisabled: true,
            hasFinishedRegistration: true
        };

        const disabled_account_1 = {
            email: "disabled1@email.com",
            password: "password123"
        };
        const disabled_account_2 = {
            email: "disabled2@email.com",
            password: "password123"
        };
        const disabled_account_3 = {
            email: "disabled3@email.com",
            password: "password123"
        };
        const disabled_account_email = {
            email: "disabled.mail@email.com",
            password: "password123"
        };
        const test_user_admin = {
            email: "admin@email.com",
            password: "password123"
        };

        beforeAll(async () => {
            [
                disabled_test_company_1,
                disabled_test_company_2,
                disabled_test_company_3,
                disabled_test_company_mail
            ] = await Company.create([
                disabled_test_company_1_data,
                disabled_test_company_2_data,
                disabled_test_company_3_data,
                disabled_test_company_mail_data
            ]);

            await Account.create([
                {
                    email: disabled_account_1.email,
                    password: await hash(disabled_account_1.password),
                    company: disabled_test_company_1._id
                },
                {
                    email: disabled_account_2.email,
                    password: await hash(disabled_account_2.password),
                    company: disabled_test_company_2._id
                },
                {
                    email: disabled_account_3.email,
                    password: await hash(disabled_account_3.password),
                    company: disabled_test_company_3._id
                },
                {
                    email: disabled_account_email.email,
                    password: await hash(disabled_account_email.password),
                    company: disabled_test_company_mail._id
                },
                {
                    email: test_user_admin.email,
                    password: await hash(test_user_admin.password),
                    isAdmin: true,
                }
            ]);
        });

        afterAll(async () => {
            await Company.deleteMany({
                _id: {
                    $in: [
                        disabled_account_1._id,
                        disabled_account_2._id,
                        disabled_account_3._id,
                        disabled_account_email._id
                    ]
                }
            });
            await Account.deleteMany({
                email: {
                    $in: [
                        disabled_account_1.email,
                        disabled_account_2.email,
                        disabled_account_3.email,
                        disabled_account_email.email,
                        test_user_admin.email
                    ]
                }
            });
        });

        afterEach(async () => {
            await test_agent
                .delete("/auth/login")
                .expect(StatusCodes.OK);
        });

        test("should fail to enable if logged as different company", async () => {

            await test_agent
                .post("/auth/login")
                .send(disabled_account_2)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .put(`/company/${disabled_test_company_1._id}/enable`)
                .expect(StatusCodes.FORBIDDEN);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    msg: ValidationReasons.INSUFFICIENT_PERMISSIONS_COMPANY_SETTINGS
                })
            ]));
        });

        test("Should enable company if god token is sent", async () => {

            const res = await test_agent
                .put(`/company/${disabled_test_company_3._id}/enable`)
                .send(withGodToken())
                .expect(StatusCodes.OK);

            expect(res.body.isDisabled).toBe(false);
        });

        test("Should enable company if logged as admin", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .put(`/company/${disabled_test_company_2._id}/enable`)
                .expect(StatusCodes.OK);

            expect(res.body.isDisabled).toBe(false);
        });

        test("Should enable company if logged as same company", async () => {

            await test_agent
                .post("/auth/login")
                .send(disabled_account_1)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .put(`/company/${disabled_test_company_1._id}/enable`)
                .expect(StatusCodes.OK);

            expect(res.body.isDisabled).toBe(false);
        });

        describe("With offers", () => {
            const assertOfferList = (offers, expectedIsHidden, expectedHiddenReason) => {
                expect(offers.every(({ isHidden }) => isHidden === expectedIsHidden)).toBe(true);
                expect(offers.every(({ hiddenReason }) => hiddenReason === expectedHiddenReason)).toBe(true);
            };

            let disabled_company_with_offers;
            const disabled_company_with_offers_data = {
                name: "company-with-offers",
                isDisabled: true,
                hasFinishedRegistration: true,
                logo: "http://awebsite.com/alogo.jpg",
            };
            const account_with_offers = {
                email: "offers@email.com",
                password: "password123",
            };

            beforeAll(async () => {
                disabled_company_with_offers = await Company.create(disabled_company_with_offers_data);
                await Account.create({
                    email: account_with_offers.email,
                    password: await hash(account_with_offers.password),
                    company: disabled_company_with_offers._id
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
                    isHidden: true,
                    hiddenReason: OfferConstants.HiddenOfferReasons.COMPANY_DISABLED,
                    owner: disabled_company_with_offers._id,
                    ownerName: disabled_company_with_offers.name,
                    ownerLogo: disabled_company_with_offers.logo,
                };

                await Offer.create([offer, offer]);
            });

            afterAll(async () => {
                await Account.delete({ email: account_with_offers.email });
                await Company.deleteMany({ name: disabled_company_with_offers_data.name });
                await Offer.deleteMany({ owner: disabled_company_with_offers._id });
            });

            test("should change offers' 'isHidden' on company enable", async () => {

                const offersBefore = await Offer.find({ owner: disabled_company_with_offers._id });

                assertOfferList(offersBefore, true, OfferConstants.HiddenOfferReasons.COMPANY_DISABLED);

                const res = await test_agent
                    .put(`/company/${disabled_company_with_offers._id}/enable`)
                    .send(withGodToken())
                    .expect(StatusCodes.OK);

                expect(res.body.isDisabled).toBe(false);

                const offersAfter = await Offer.find({ owner: disabled_company_with_offers._id });

                assertOfferList(offersAfter, false, undefined);
            });
        });

        test("should send an email to the company user when it is enabled", async () => {
            await test_agent
                .put(`/company/${disabled_test_company_mail._id}/enable`)
                .send(withGodToken())
                .expect(StatusCodes.OK);

            const emailOptions = COMPANY_ENABLED_NOTIFICATION(
                disabled_test_company_mail.name
            );

            expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: emailOptions.subject,
                to: disabled_account_email.email,
                template: emailOptions.template,
                context: emailOptions.context,
            }));
        });
    });
});
