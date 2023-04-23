import { StatusCodes as HTTPStatus } from "http-status-codes";
import { ErrorTypes } from "../../src/api/middleware/errorHandler";
import ValidationReasons from "../../src/api/middleware/validators/validationReasons";
import {
    COMPANY_BLOCKED_NOTIFICATION,
    COMPANY_DISABLED_NOTIFICATION,
    COMPANY_ENABLED_NOTIFICATION,
    COMPANY_UNBLOCKED_NOTIFICATION
} from "../../src/email-templates/companyManagement";
import EmailService from "../../src/lib/emailService";
import hash from "../../src/lib/passwordHashing";
import Account from "../../src/models/Account";
import Company from "../../src/models/Company";
import Offer from "../../src/models/Offer";
import OfferConstants from "../../src/models/constants/Offer";
import withGodToken from "../utils/GodToken";
import { DAY_TO_MS } from "../utils/TimeConstants";

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
