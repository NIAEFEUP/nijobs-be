const config = require("../../src/config/env");
const HTTPStatus = require("http-status-codes");
const Account = require("../../src/models/Account");
const Company = require("../../src/models/Company");
const hash = require("../../src/lib/passwordHashing");
const ValidationReasons = require("../../src/api/middleware/validators/validationReasons");
const CompanyConstants = require("../../src/models/constants/Company");
const { HiddenOfferReasons } = require("../../src/models/constants/Offer");
const withGodToken = require("../utils/GodToken");
const fs = require("fs");
const path = require("path");
const { ErrorTypes } = require("../../src/api/middleware/errorHandler");
const EmailService = require("../../src/lib/emailService");
const { COMPANY_UNBLOCKED_NOTIFICATION, COMPANY_BLOCKED_NOTIFICATION } = require("../../src/email-templates/companyManagement");
const { MAX_FILE_SIZE_MB } = require("../../src/api/middleware/utils");
const { DAY_TO_MS } = require("../utils/TimeConstants");
const Offer = require("../../src/models/Offer");
const OfferConstants = require("../../src/models/constants/Offer");

const getCompanies = async (options) =>
    [...(await Company.find(options)
        .sort({ name: "asc" })
        .exec())]
        .map((company) => ({
            ...company.toObject(),
            _id: company._id.toString(),
        }));

describe("Company endpoint", () => {

    const generateTestOffer = (params) => ({
        title: "Test Offer",
        publishDate: (new Date(Date.now() - (DAY_TO_MS))).toISOString(),
        publishEndDate: (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
        description: "For Testing Purposes",
        contacts: ["geral@niaefeup.pt", "229417766"],
        jobType: "SUMMER INTERNSHIP",
        fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
        technologies: ["React", "CSS"],
        location: "Testing Street, Test City, 123",
        isHidden: false,
        requirements: ["The candidate must be tested", "Fluent in testJS"],
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
                    .field("contacts", ["contact1", "contact2"])
                    .expect(HTTPStatus.OK);

                const test_company = [... await Company.find({})][0];
                expect([...test_company.contacts]).toEqual(["contact1", "contact2"]);
                expect(test_company.hasFinishedRegistration).toBe(true);
                expect(test_company.bio).toBe("A very interesting and compelling bio");
                const filename = path.join(`${config.upload_folder}/${test_company.id}.png`);
                expect(fs.existsSync(filename)).toBe(true);

                const res = await test_agent
                    .post("/company/application/finish")
                    .attach("logo", "test/data/logo-niaefeup.png")
                    .field("bio", "A very interesting and compelling bio")
                    .field("contacts", ["contact1", "contact2"])
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
                    .field("contacts", "contact1")
                    .expect(HTTPStatus.OK);

                const test_company = [... await Company.find({})][0];
                expect([...test_company.contacts]).toEqual(["contact1"]);
                expect(test_company.hasFinishedRegistration).toBe(true);
                expect(test_company.bio).toBe("A very interesting and compelling bio");
                const filename = path.join(`${config.upload_folder}/${test_company.id}.png`);
                expect(fs.existsSync(filename)).toBe(true);

                const res = await test_agent
                    .post("/company/application/finish")
                    .attach("logo", "test/data/logo-niaefeup.png")
                    .field("bio", "A very interesting and compelling bio")
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
                        .attach("logo", __filename)
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
                        company: company._id });
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
                        "publishDate": (new Date(Date.now() - (DAY_TO_MS))).toISOString(),
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
                        "publishDate": (new Date(Date.now() - (DAY_TO_MS))).toISOString(),
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
            await Account.create({ email: test_user_email.email,
                password: await hash(test_user_email.password),
                company: test_company_email._id });
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
                        "publishDate": (new Date(Date.now() - (DAY_TO_MS))).toISOString(),
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
                        "publishDate": (new Date(Date.now() - (DAY_TO_MS))).toISOString(),
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
                        "publishDate": (new Date(Date.now() - (DAY_TO_MS))).toISOString(),
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

        let test_company, disabled_test_company_1, disabled_test_company_2, disabled_test_company_3, disabled_test_company_4;
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

        beforeAll(async () => {
            await test_agent
                .delete("/auth/login")
                .expect(HTTPStatus.OK);

            await Company.deleteMany({});

            [
                test_company,
                disabled_test_company_1,
                disabled_test_company_2,
                disabled_test_company_3,
                disabled_test_company_4
            ] = await Company.create([
                {
                    name: "test-company"
                }, {
                    name: "disabled-test-company-1",
                    isDisabled: true
                }, {
                    name: "disabled-test-company-2",
                    isDisabled: true
                }, {
                    name: "disabled-test-company-3",
                    isDisabled: true
                }, {
                    name: "disabled-test-company-4",
                    logo: "http://awebsite.com/alogo.jpg",
                    isDisabled: true
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
                company: test_company._id
            });
            await Account.create({
                email: test_user_company_2.email,
                password: await hash(test_user_company_2.password),
                company: disabled_test_company_1._id
            });

            const offer = {
                title: "Test Offer",
                publishDate: new Date(Date.now() - (DAY_TO_MS)),
                publishEndDate: new Date(Date.now() + (DAY_TO_MS)),
                description: "For Testing Purposes",
                contacts: ["geral@niaefeup.pt", "229417766"],
                jobType: "SUMMER INTERNSHIP",
                fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                technologies: ["React", "CSS"],
                location: "Testing Street, Test City, 123",
                requirements: ["The candidate must be tested", "Fluent in testJS"],
                owner: disabled_test_company_4._id,
                ownerName: disabled_test_company_4.name,
                ownerLogo: disabled_test_company_4.logo,
                isHidden: true,
                hiddenReason: HiddenOfferReasons.COMPANY_DISABLED,
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

        test("should fail to enable already enabled company if god token is sent", async () => {

            const res = await test_agent
                .put("/company/enable")
                .send(withGodToken({ owner: test_company._id }));

            expect(res.status).toBe(HTTPStatus.FORBIDDEN);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toEqual([ValidationReasons.COMPANY_ENABLED]);
        });

        test("should fail to enable already enabled company if logged as admin", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put("/company/enable")
                .send({ owner: test_company._id });

            expect(res.status).toBe(HTTPStatus.FORBIDDEN);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toEqual([ValidationReasons.COMPANY_ENABLED]);
        });

        test("should fail to enable already enabled company if logged as same company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_1)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put("/company/enable")
                .send({ owner: test_company._id });

            expect(res.status).toBe(HTTPStatus.FORBIDDEN);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toEqual([ValidationReasons.COMPANY_ENABLED]);
        });

        test("should fail to enable already enabled company if logged as different company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put("/company/enable")
                .send({ owner: test_company._id });

            expect(res.status).toBe(HTTPStatus.FORBIDDEN);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toEqual([ValidationReasons.COMPANY_ENABLED]);
        });

        test("should fail to enable already enabled company if not logged in", async () => {

            const res = await test_agent
                .put("/company/enable")
                .send({ owner: test_company._id });

            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toEqual([ValidationReasons.INSUFFICIENT_PERMISSIONS]);
        });

        test("should fail to enable disabled company if logged as different company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_1)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put("/company/enable")
                .send({ owner: disabled_test_company_1._id });

            expect(res.status).toBe(HTTPStatus.FORBIDDEN);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toEqual([ValidationReasons.INVALID_COMPANY]);

        });

        test("Should enable company if god token is sent", async () => {

            const res = await test_agent
                .put("/company/enable")
                .send(withGodToken({ owner: disabled_test_company_3._id }));

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.company.isDisabled).toBe(false);
        });

        test("Should enable company if logged as admin", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put("/company/enable")
                .send({ owner: disabled_test_company_2._id });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.company.isDisabled).toBe(false);
        });

        test("Should enable company if logged as same company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put("/company/enable")
                .send({ owner: disabled_test_company_1._id });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.company.isDisabled).toBe(false);
        });

        test("should change offers isHidden on company enable", async () => {

            const offersBefore = await Offer.find({ owner: disabled_test_company_4._id });

            expect(offersBefore.every(({ isHidden }) => isHidden === true)).toBe(true);
            expect(offersBefore.every(({ hiddenReason }) => hiddenReason === HiddenOfferReasons.COMPANY_DISABLED)).toBe(true);

            const res = await test_agent
                .put("/company/enable")
                .send(withGodToken({ owner: disabled_test_company_4._id }));

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.company.isDisabled).toBe(false);

            const offersAfter = await Offer.find({ owner: disabled_test_company_4._id });

            expect(offersAfter.every(({ isHidden }) => isHidden === false)).toBe(true);
            expect(offersAfter.every(({ hiddenReason }) => hiddenReason === undefined)).toBe(true);
        });
    });

    describe("PUT /company/disable", () => {

        let test_company_1, test_company_2, test_company_3, disabled_test_company;
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

        beforeAll(async () => {

            await test_agent
                .delete("/auth/login")
                .expect(HTTPStatus.OK);

            await Company.deleteMany({});

            [test_company_1, test_company_2, test_company_3, disabled_test_company] = await Company.create([
                {
                    name: "test-company-1"
                }, {
                    name: "test-company-2",
                }, {
                    name: "test-company-3",
                    logo: "http://awebsite.com/alogo.jpg",
                }, {
                    name: "disabled-test-company",
                    isDisabled: true
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
                company: disabled_test_company._id
            });
            await Account.create({
                email: test_user_company_2.email,
                password: await hash(test_user_company_2.password),
                company: test_company_1._id
            });

            const offer = {
                title: "Test Offer",
                publishDate: new Date(Date.now() - (DAY_TO_MS)),
                publishEndDate: new Date(Date.now() + (DAY_TO_MS)),
                description: "For Testing Purposes",
                contacts: ["geral@niaefeup.pt", "229417766"],
                jobType: "SUMMER INTERNSHIP",
                fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
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

        test("should fail to disable already disabled company if god token is sent", async () => {

            const res = await test_agent
                .put("/company/disable")
                .send(withGodToken({ owner: disabled_test_company._id }));

            expect(res.status).toBe(HTTPStatus.FORBIDDEN);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toEqual([ValidationReasons.COMPANY_DISABLED]);
        });

        test("should fail to disable already disabled company if logged as same company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_1)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put("/company/disable")
                .send({ owner: disabled_test_company._id });

            expect(res.status).toBe(HTTPStatus.FORBIDDEN);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toEqual([ValidationReasons.COMPANY_DISABLED]);

        });

        test("should fail to disable company if logged as admin", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put("/company/disable")
                .send({ owner: test_company_1._id });

            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toEqual([ValidationReasons.INSUFFICIENT_PERMISSIONS]);

        });

        test("should fail to disable company if logged as different company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_1)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put("/company/disable")
                .send({ owner: test_company_1._id });

            expect(res.status).toBe(HTTPStatus.FORBIDDEN);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toEqual([ValidationReasons.INVALID_COMPANY]);
        });

        test("should fail to disable company if not logged in", async () => {

            const res = await test_agent
                .put("/company/disable")
                .send({ owner: test_company_1._id });

            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            expect(res.body.error_code).toBe(ErrorTypes.FORBIDDEN);
            expect(res.body.errors).toEqual([ValidationReasons.INSUFFICIENT_PERMISSIONS]);

        });

        test("Should disable company if god token is sent", async () => {

            const res = await test_agent
                .put("/company/disable")
                .send(withGodToken({ owner: test_company_2._id }));

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.company.isDisabled).toBe(true);
        });

        test("Should disable company if logged as same company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put("/company/disable")
                .send({ owner: test_company_1._id });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.company.isDisabled).toBe(true);
        });

        test("should change offers isHidden on company disable", async () => {

            const offersBefore = await Offer.find({ owner: test_company_3._id });

            expect(offersBefore.every(({ isHidden }) => isHidden === false)).toBe(true);
            expect(offersBefore.every(({ hiddenReason }) => hiddenReason === undefined)).toBe(true);

            const res = await test_agent
                .put("/company/disable")
                .send(withGodToken({ owner: test_company_3._id }));

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body.company.isDisabled).toBe(true);

            const offersAfter = await Offer.find({ owner: test_company_3._id });

            expect(offersAfter.every(({ isHidden }) => isHidden === true)).toBe(true);
            expect(offersAfter.every(({ hiddenReason }) => hiddenReason === HiddenOfferReasons.COMPANY_DISABLED)).toBe(true);
        });
    });
});
