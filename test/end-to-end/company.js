const config = require("../../src/config/env");
const HTTPStatus = require("http-status-codes");
const Account = require("../../src/models/Account");
const Company = require("../../src/models/Company");
const hash = require("../../src/lib/passwordHashing");
const ValidationReasons = require("../../src/api/middleware/validators/validationReasons");
const CompanyConstants = require("../../src/models/constants/Company");
const fs = require("fs");
const path = require("path");
const { ErrorTypes } = require("../../src/api/middleware/errorHandler");
const withGodToken = require("../utils/GodToken");
const EmailService = require("../../src/lib/emailService");
const { COMPANY_UNBLOCKED_NOTIFICATION, COMPANY_BLOCKED_NOTIFICATION } = require("../../src/email-templates/companyManagement");

const getCompanies = async (options) =>
    [...(await Company.find(options))]
        .map((company) => ({
            ...company.toObject(),
            _id: company._id.toString(),
        }));

describe("Company application endpoint", () => {
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
                    ValidationReasons.REGISTRATION_FINISHED
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
                    ValidationReasons.REGISTRATION_FINISHED
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

    describe("POST /company/:companyId/block", () => {
        const test_agent = agent();

        const company_data = {
            name: "Company Ltd"
        };

        const test_users = Array(5).fill({}).map((_c, idx) => ({
            email: `test_email_${idx}@email.com`,
            password: "password123",
        }));

        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };

        let test_company_1, test_company_2, blocked_test_company_1, blocked_test_company_2, test_email_company;

        beforeAll(async () => {
            await Company.deleteMany({});
            test_company_1 = await Company.create({ name: company_data.name, hasFinishedRegistration: true });
            test_company_2 = await Company.create({ name: company_data.name, hasFinishedRegistration: true });
            test_email_company = await Company.create({ name: company_data.name, hasFinishedRegistration: true });
            blocked_test_company_1 = await Company.create({ name: company_data.name, hasFinishedRegistration: true, isBlocked: true });
            blocked_test_company_2 = await Company.create({ name: company_data.name, hasFinishedRegistration: true, isBlocked: true });
            await Account.deleteMany({});
            [test_email_company, test_company_1, test_company_2, blocked_test_company_1, blocked_test_company_2]
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
                .post(`/company/${test_company_1.id}/block`)
                .expect(HTTPStatus.UNAUTHORIZED);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual(ValidationReasons.INSUFFICIENT_PERMISSIONS);
        });

        test("should fail if logged in as company", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_users[1])
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .post(`/company/${test_company_1.id}/block`)
                .expect(HTTPStatus.UNAUTHORIZED);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual(ValidationReasons.INSUFFICIENT_PERMISSIONS);
        });

        test("should allow if logged in as admin", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .post(`/company/${test_company_1.id}/block`)
                .expect(HTTPStatus.OK);
            expect(res.body).toHaveProperty("isBlocked", true);
        });

        test("should fail if not a valid id", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .post("/company/123/block")
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
                .post(`/company/${id}/block`)
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
                .post(`/company/${test_company_2.id}/block`)
                .send(withGodToken())
                .expect(HTTPStatus.OK);
            expect(res.body).toHaveProperty("isBlocked", true);
        });

        test("should fail to block the account if already blocked", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .post(`/company/${blocked_test_company_1.id}/block`)
                .send()
                .expect(HTTPStatus.FORBIDDEN);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.FORBIDDEN);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual(ValidationReasons.COMPANY_ALREADY_BLOCKED);

        });

        test("should send an email to the company user when it is blocked", async () => {
            await test_agent
                .del("/auth/login");
            await test_agent
                .post(`/company/${test_email_company._id}/block`)
                .send(withGodToken())
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
            expect(res.body.errors).toContainEqual(ValidationReasons.INSUFFICIENT_PERMISSIONS);
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
            expect(res.body.errors).toContainEqual(ValidationReasons.INSUFFICIENT_PERMISSIONS);
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

    });
});
