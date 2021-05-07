const config = require("../../src/config/env");
const HTTPStatus = require("http-status-codes");
const Account = require("../../src/models/Account");
const Company = require("../../src/models/Company");
const hash = require("../../src/lib/passwordHashing");
const ValidationReasons = require("../../src/api/middleware/validators/validationReasons");
const CompanyConstants = require("../../src/models/constants/Company");
const fs = require("fs");
const path = require("path");

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
});
