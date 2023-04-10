import fs from "fs";
import { StatusCodes } from "http-status-codes";
import path from "path";
import { fileURLToPath } from "url";
import { MAX_FILE_SIZE_MB } from "../../../../src/api/middleware/utils";
import ValidationReasons from "../../../../src/api/middleware/validators/validationReasons";
import config from "../../../../src/config/env";
import hash from "../../../../src/lib/passwordHashing";
import Account from "../../../../src/models/Account";
import Company from "../../../../src/models/Company";
import CompanyConstants from "../../../../src/models/constants/Company";
import withGodToken from "../../../utils/GodToken";
import ValidatorTester from "../../../utils/ValidatorTester";

describe("POST /company/application/finish", () => {

    const test_agent = agent();

    const testUserAdmin = {
        email: "admin@email.com",
        password: "password123",
    };

    const testUser = {
        email: "user@email.com",
        password: "password123",
    };
    const nonFinishedCompanyData = {
        name: "Company Ltd",
    };
    let testCompany;

    const testSingleContactUser = {
        email: "userSingleContact@email.com",
        password: "password123",
    };
    const nonFinishedSingleContactCompanyData = {
        name: "Company Ltd2",
    };
    let testSingleContactCompany;

    const testFinishedUser = {
        email: "finishedUsser@email.com",
        password: "password123",
    };
    const finishedCompanyData = {
        name: "Company Ltd",
        hasFinishedRegistration: true,
    };

    beforeAll(async () => {
        await Company.deleteMany({});
        await Account.deleteMany({});

        await Account.create({
            email: testUserAdmin.email,
            password: await hash(testUserAdmin.password),
            isAdmin: true,
        });

        const [
            _testCompany,
            testFinishedCompany,
            _testSingleContactCompany,
        ] = await Company.create([
            nonFinishedCompanyData,
            finishedCompanyData,
            nonFinishedSingleContactCompanyData,
        ]);
        testCompany = _testCompany;
        testSingleContactCompany = _testSingleContactCompany;

        await Account.create({
            email: testUser.email,
            password: await hash(testUser.password),
            company: testCompany._id
        });

        await Account.create({
            email: testFinishedUser.email,
            password: await hash(testFinishedUser.password),
            company: testFinishedCompany._id
        });

        await Account.create({
            email: testSingleContactUser.email,
            password: await hash(testSingleContactUser.password),
            company: testSingleContactCompany._id
        });
    });

    afterAll(async () => {
        await Company.deleteMany({});
        await Account.deleteMany({});
    });

    beforeEach(async () => {
        // Login
        await test_agent
            .post("/auth/login")
            .send(testUser)
            .expect(StatusCodes.OK);
    });

    afterEach(async () => {
        // Logout
        await test_agent
            .delete("/auth/login")
            .expect(StatusCodes.OK);
    });

    describe("Input Validation", () => {

        const validationUser = {
            email: "validation@email.com",
            password: "password123",
        };
        const validationCompany = {
            name: "Validation Company",
        };

        beforeAll(async () => {
            const test_company = await Company.create(validationCompany);
            await Account.create({
                email: validationUser.email,
                password: await hash(validationUser.password),
                company: test_company._id
            });
        });

        beforeEach(async () => {
            await test_agent
                .post("/auth/login")
                .send(validationUser)
                .expect(StatusCodes.OK);
        });

        afterAll(async () => {
            await Company.deleteMany({ name: validationCompany.name });
            await Account.deleteMany({ email: validationUser.email });
        });

        const endpointRequest = async (params) => {

            let requestBuilder = test_agent
                .post("/company/application/finish")
                .attach("logo", params.logo || "test/data/logo-niaefeup.png");

            if (params.bio) {
                requestBuilder = requestBuilder
                    .field("bio", params.bio);
            }

            if (params.contacts) {
                requestBuilder = requestBuilder
                    .field("contacts", params.contacts);
            }

            const res = await requestBuilder;

            return res;
        };

        const EndpointValidator = ValidatorTester(endpointRequest);
        const BodyValidator = EndpointValidator("body");

        describe("contacts", () => {
            const FieldValidator = BodyValidator("contacts");
            FieldValidator.isRequired();

            // Can't exactly test this unless we increase the min length
            // This is due to the fact that empty arrays are treated as an empty string in multipart form data
            // FieldValidator.mustHaveAtLeast(CompanyConstants.contacts.min_length);

            FieldValidator.mustBeArrayBetween(CompanyConstants.contacts.min_length, CompanyConstants.contacts.max_length);
        });

        describe("bio", () => {
            const FieldValidator = BodyValidator("bio");
            FieldValidator.isRequired();
            FieldValidator.hasMaxLength(CompanyConstants.bio.max_length);
        });

        describe("logo", () => {
            // test this manually since there are no image specific validator testers
            test("should fail if file size is too large", async () => {
                const res = await endpointRequest({
                    logo: "test/data/logo-niaefeup-10mb.png",
                    contacts: ["Some test contact"],
                    bio: "some tet bio"
                });

                expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": ValidationReasons.FILE_TOO_LARGE(MAX_FILE_SIZE_MB),
                    "param": "logo",
                });
            });

            test("should fail if file is invalid format", async () => {
                const res = await endpointRequest({
                    logo: fileURLToPath(import.meta.url),
                    contacts: ["Some test contact"],
                    bio: "some tet bio"
                });

                expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": ValidationReasons.IMAGE_FORMAT,
                    "param": "logo",
                });
            });
        });
    });

    test("should fail if making unauthenticated request", async () => {

        await test_agent
            .delete("/auth/login")
            .expect(StatusCodes.OK);

        await request()
            .post("/company/application/finish")
            .expect(StatusCodes.UNAUTHORIZED);
    });

    test("should fail if authenticated as admin", async () => {
        // Login
        await test_agent
            .post("/auth/login")
            .send(testUserAdmin)
            .expect(StatusCodes.OK);

        await request()
            .post("/company/application/finish")
            .expect(StatusCodes.UNAUTHORIZED);
    });

    test("should fail if sending god token", async () => {

        await test_agent
            .delete("/auth/login")
            .expect(StatusCodes.OK);

        await test_agent
            .post("/company/application/finish")
            .send(withGodToken())
            .expect(StatusCodes.UNAUTHORIZED);
    });

    test("should fail if company has already finished registration", async () => {
        // Login
        await test_agent
            .post("/auth/login")
            .send(testFinishedUser)
            .expect(StatusCodes.OK);

        const res = await test_agent
            .post("/company/application/finish")
            .expect(StatusCodes.FORBIDDEN);

        expect(res.body).toHaveProperty("errors", expect.arrayContaining(
            [
                expect.objectContaining({
                    "msg": ValidationReasons.REGISTRATION_FINISHED,
                }),
            ]
        ));
    });

    test("should finish the application with multiple contacts", async () => {

        const contacts = ["contact1", "contact2"];

        await test_agent
            .post("/company/application/finish")
            .attach("logo", "test/data/logo-niaefeup.png")
            .field("bio", "A very interesting and compelling bio")
            .field("contacts", contacts)
            .expect(StatusCodes.OK);

        const test_companies = await Company.find({ hasFinishedRegistration: true });
        expect(test_companies).toHaveLength(2);
        expect(test_companies).toEqual(expect.arrayContaining(
            [
                expect.objectContaining({
                    name: testCompany.name,
                    hasFinishedRegistration: true,
                    bio: "A very interesting and compelling bio",
                    contacts,
                }),
            ]
        ));

        const filename = path.join(`${config.upload_folder}/${testCompany.id}.png`);
        expect(fs.existsSync(filename)).toBe(true); // TODO: change to async

        // clean up file created
        await fs.promises.unlink(filename);
    });

    test("should finish the application with single contact", async () => {

        await test_agent
            .post("/auth/login")
            .send(testSingleContactUser)
            .expect(StatusCodes.OK);

        const contacts = ["contact1"];

        await test_agent
            .post("/company/application/finish")
            .attach("logo", "test/data/logo-niaefeup.png")
            .field("bio", "A very interesting and compelling bio")
            .field("contacts", contacts)
            .expect(StatusCodes.OK);

        const test_companies = await Company.find({ hasFinishedRegistration: true });
        expect(test_companies).toHaveLength(3);
        expect(test_companies).toEqual(expect.arrayContaining(
            [
                expect.objectContaining({
                    name: testSingleContactCompany.name,
                    hasFinishedRegistration: true,
                    bio: "A very interesting and compelling bio",
                    contacts,
                }),
            ]
        ));

        const filename = path.join(`${config.upload_folder}/${testSingleContactCompany.id}.png`);
        expect(fs.existsSync(filename)).toBe(true); // TODO: change to async

        // clean up file created
        await fs.promises.unlink(filename);
    });
});
