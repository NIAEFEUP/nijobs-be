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

    const test_agent = agent();

    beforeAll(async () => {
        await Company.deleteMany({});
        await Account.deleteMany({});
    });

    afterAll(async () => {
        await Company.deleteMany({});
        await Account.deleteMany({});
    });

    describe("ID Validation", () => {
        const adminReason = "An admin reason!";

        test("should fail if not a valid id", async () => {
            const res = await test_agent
                .put("/company/123/block")
                .send(withGodToken({ adminReason }))
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
                .put(`/company/${id}/block`)
                .send(withGodToken({ adminReason }))
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

        let test_company;
        const test_company_data = {
            name: "Company Ltd",
            hasFinishedRegistration: true,
        };

        const test_user = {
            email: "no-auth@email.com",
            password: "password123"
        };

        beforeAll(async () => {
            await Company.deleteMany({});
            await Account.deleteMany({});

            test_company = await Company.create(test_company_data);

            // Need to create the account because of the mail notification
            await Account.create({
                email: test_user.email,
                password: await hash(test_user.password),
                company: test_company._id
            });
        });

        afterAll(async () => {
            await Company.deleteMany({ _id: test_company._id });
            await Account.deleteMany({ email: test_user.email });
        });

        test("should fail if not logged in", async () => {
            const res = await test_agent
                .put(`/company/${test_company.id}/block`)
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

        let test_company_1, test_company_2, test_company_mail;
        const company_data = {
            name: "Company Ltd",
            hasFinishedRegistration: true,
        };

        const test_user_1 = {
            email: "company1@email.com",
            password: "password123"
        };

        const test_user_2 = {
            email: "company2@email.com",
            password: "password123"
        };

        const test_user_mail = {
            email: "company-mail@email.com",
            password: "password123"
        };

        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };

        const adminReason = "An admin reason!";

        beforeAll(async () => {
            [test_company_1, test_company_2, test_company_mail] = await Company.create([
                company_data,
                company_data,
                company_data
            ]);

            await Account.create([
                {
                    email: test_user_1.email,
                    password: await hash(test_user_1.password),
                    company: test_company_1._id
                }, {
                    email: test_user_2.email,
                    password: await hash(test_user_2.password),
                    company: test_company_2._id
                }, {
                    email: test_user_mail.email,
                    password: await hash(test_user_mail.password),
                    company: test_company_mail._id
                }, {
                    email: test_user_admin.email,
                    password: await hash(test_user_admin.password),
                    isAdmin: true
                }
            ]);
        });

        afterAll(async () => {
            await Company.deleteMany({ _id: { $in: [test_company_1._id, test_company_2._id, test_company_mail._id] } });
            await Account.deleteMany({ email: { $in: [test_user_1.email, test_user_2.email, test_user_mail.email] } });
        });

        afterEach(async () => {
            await test_agent
                .delete("/auth/login")
                .expect(StatusCodes.OK);
        });

        test("should fail if logged in as company", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_1)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .put(`/company/${test_company_1.id}/block`)
                .expect(StatusCodes.UNAUTHORIZED);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    msg: ValidationReasons.INSUFFICIENT_PERMISSIONS
                })
            ]));
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
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    param: "adminReason",
                    msg: ValidationReasons.REQUIRED
                })
            ]));
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

            expect(res.body).toEqual(expect.objectContaining({
                isBlocked: true,
                adminReason
            }));
        });

        test("should allow with god token", async () => {
            const res = await test_agent
                .put(`/company/${test_company_2.id}/block`)
                .send(withGodToken({ adminReason }))
                .expect(StatusCodes.OK);

            expect(res.body).toEqual(expect.objectContaining({
                isBlocked: true,
                adminReason
            }));
        });

        test("should send an email to the company user when it is blocked", async () => {
            await test_agent
                .put(`/company/${test_company_mail._id}/block`)
                .send(withGodToken({ adminReason }))
                .expect(StatusCodes.OK);

            const emailOptions = COMPANY_BLOCKED_NOTIFICATION(
                test_company_mail.name
            );

            expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: emailOptions.subject,
                to: test_user_mail.email,
                template: emailOptions.template,
                context: emailOptions.context,
            }));
        });

        describe("With offers", () => {

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


            let test_company_with_offers;
            const test_company_with_offers_data = {
                name: "Company With Offers",
                logo: "https://www.google.com/image.jpg",
                hasFinishedRegistration: true,
            };

            const test_user_with_offers = {
                email: "offers@email.com",
                password: "password123"
            };

            beforeAll(async () => {
                await Offer.deleteMany({});

                test_company_with_offers = await Company.create(test_company_with_offers_data);

                await Account.create({
                    email: test_user_with_offers.email,
                    password: await hash(test_user_with_offers.password),
                    company: test_company_with_offers._id
                });
            });

            afterAll(async () => {
                await Offer.deleteMany({});
            });

            afterEach(async () => {
                await test_agent
                    .put(`/company/${test_company_with_offers.id}/unblock`)
                    .send(withGodToken({}))
                    .expect(StatusCodes.OK);
            });

            describe("With active offers", () => {

                let test_active_offers;

                beforeAll(async () => {
                    test_active_offers = await Offer.create(Array(3).fill(generateTestOffer({
                        "publishDate": (new Date(Date.now())).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
                        owner: test_company_with_offers._id,
                        ownerName: test_company_with_offers.name,
                        ownerLogo: test_company_with_offers.logo
                    })));
                });

                afterAll(async () => {
                    await Offer.deleteMany({ _id: { $in: test_active_offers.map((offer) => offer._id) } });
                });

                test("should block active offers", async () => {

                    const res = await test_agent
                        .put(`/company/${test_company_with_offers.id}/block`)
                        .send(withGodToken({ adminReason }))
                        .expect(StatusCodes.OK);

                    expect(res.body).toEqual(expect.objectContaining({
                        isBlocked: true,
                        adminReason
                    }));

                    const offers = await Offer.find({ _id: { $in: test_active_offers.map((offer) => offer._id) } });

                    expect(offers).toHaveLength(test_active_offers.length);
                    expect(offers).not.toEqual(expect.arrayContaining([
                        expect.objectContaining({
                            isHidden: false, // we can check on just this attribute since both are set at the same time
                        })
                    ]));
                });
            });

            describe("With hidden offers", () => {

                let test_hidden_offers;

                beforeAll(async () => {
                    test_hidden_offers = await Offer.create(Array(3).fill(generateTestOffer({
                        "publishDate": (new Date(Date.now())).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
                        owner: test_company_with_offers._id,
                        ownerName: test_company_with_offers.name,
                        ownerLogo: test_company_with_offers.logo,
                        isHidden: true,
                        hiddenReason: OfferConstants.HiddenOfferReasons.ADMIN_BLOCK
                    })));
                });

                afterAll(async () => {
                    await Offer.deleteMany({ _id: { $in: test_hidden_offers.map((offer) => offer._id) } });
                });

                test("should not override offers already hidden", async () => {

                    const res = await test_agent
                        .put(`/company/${test_company_with_offers.id}/block`)
                        .send(withGodToken({ adminReason }))
                        .expect(StatusCodes.OK);

                    expect(res.body).toEqual(expect.objectContaining({
                        isBlocked: true,
                        adminReason
                    }));

                    const offers = await Offer.find({ _id: { $in: test_hidden_offers.map((offer) => offer._id) } });

                    expect(offers).toHaveLength(test_hidden_offers.length);
                    expect(offers).not.toEqual(expect.arrayContaining([
                        expect.objectContaining({
                            isHidden: false,
                            hiddenReason: OfferConstants.HiddenOfferReasons.COMPANY_BLOCKED
                        })
                    ]));
                });
            });
        });
    });
});
