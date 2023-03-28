import { StatusCodes } from "http-status-codes";
import CompanyApplication, { CompanyApplicationProps } from "../../../../src/models/CompanyApplication";
import hash from "../../../../src/lib/passwordHashing";
import Account from "../../../../src/models/Account";
import ApplicationStatus from "../../../../src/models/constants/ApplicationStatus";

import { MAX_LIMIT_RESULTS } from "../../../../src/api/middleware/validators/application";

import ValidatorTester from "../../../utils/ValidatorTester";
// import ValidationReasons from "../../../../src/api/middleware/validators/validationReasons";

describe("GET /applications/company/search", () => {

    const test_agent = agent();
    const test_user_admin = {
        email: "admin@email.com",
        password: "password123",
    };

    const pendingApplication = {
        email: "test2@test.com",
        password: "password123",
        companyName: "testing company",
        motivation: "This company has a very valid motivation, because otherwise the tests would not exist.",
        submittedAt: new Date("2019-11-25").toISOString(),
    };

    const approvedApplication = {
        ...pendingApplication,
        submittedAt: new Date("2019-11-24").toISOString(),
        approvedAt: new Date(Date.parse(pendingApplication.submittedAt) + (24 * 60 * 60 * 1000)).toISOString(),
        companyName: "approved Testing company",
        email: `approved${pendingApplication.email}`,
    };

    const rejectedApplication = {
        ...pendingApplication,
        submittedAt: new Date("2019-11-23").toISOString(),
        rejectedAt: new Date(Date.parse(pendingApplication.submittedAt) + (24 * 60 * 60 * 1000)).toISOString(),
        companyName: "rejected Testing company",
        email: `rejected${pendingApplication.email}`,
        rejectReason: "2bad4nij0bs",
    };

    beforeAll(async () => {
        await Account.deleteMany({});
        await Account.create({ email: test_user_admin.email, password: await hash(test_user_admin.password), isAdmin: true });
    });

    beforeEach(async () => {
        await CompanyApplication.deleteMany({});

        // Login by default
        await test_agent
            .post("/auth/login")
            .send(test_user_admin)
            .expect(StatusCodes.OK);
    });

    afterAll(async () => {
        await Account.deleteMany({});
        await CompanyApplication.deleteMany({});
    });

    describe("Input Validation", () => {

        const EndpointValidatorTester = ValidatorTester(
            (params) => test_agent.get("/applications/company/search").query(params)
        );
        const QueryValidatorTester = EndpointValidatorTester("query");

        describe("limit", () => {
            const FieldValidatorTester = QueryValidatorTester("limit");
            FieldValidatorTester.mustBeNumber();
            FieldValidatorTester.mustBeGreaterThanOrEqualTo(1);
            FieldValidatorTester.mustBeLessThanOrEqualTo(MAX_LIMIT_RESULTS);
        });

        describe("offset", () => {
            const FieldValidatorTester = QueryValidatorTester("offset");
            FieldValidatorTester.mustBeNumber();
            FieldValidatorTester.mustBeGreaterThanOrEqualTo(0);
        });

        describe("companyName", () => {
            // the only validation that could be done on this is to test if the value is a string.
            // However, since this is coming from the query, it is always parsed as a string, so this check would never be exercised
        });

        describe("state", () => {
            const FieldValidatorTester = QueryValidatorTester("state");
            FieldValidatorTester.mustBeArray();
        });

        describe("submissionDateFrom", () => {
            const FieldValidatorTester = QueryValidatorTester("submissionDateFrom");
            FieldValidatorTester.mustBeDate();
        });

        describe("submissionDateTo", () => {
            const FieldValidatorTester = QueryValidatorTester("submissionDateTo");
            FieldValidatorTester.mustBeDate();
            FieldValidatorTester.mustBeAfter("submissionDateFrom");
        });

        describe("sortBy", () => {
            const FieldValidatorTester = QueryValidatorTester("sortBy");
            // FieldValidatorTester.mustBeString(); Same reason as above

            // Validation for this is harder to perform since there is custom validation employed
            // Perhaps we could employ a custom test, leaving as TODO
            FieldValidatorTester.mustBeInArray(Object.keys(CompanyApplicationProps));
        });
    });

    test("Should fail to search company applications if not logged in", async () => {

        await test_agent
            .delete("/auth/login")
            .expect(StatusCodes.OK);

        const res = await request()
            .get("/applications/company/search");

        expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });

    test("Should return empty list if no applications exist", async () => {
        const emptyRes = await test_agent
            .get("/applications/company/search");

        expect(emptyRes.status).toBe(StatusCodes.OK);
        expect(emptyRes.body.applications).toEqual([]);
    });

    test("Should list existing applications", async () => {
        const application = {
            email: "test2@test.com",
            password: "password123",
            companyName: "Testing company",
            motivation: "This company has a very valid motivation, because otherwise the tests would not exist.",
        };

        await CompanyApplication.create({
            ...application,
            submittedAt: Date.now(),
        });

        const nonEmptyRes = await test_agent
            .get("/applications/company/search");

        expect(nonEmptyRes.status).toBe(StatusCodes.OK);
        expect(nonEmptyRes.body.applications.length).toBe(1);
        expect(nonEmptyRes.body.applications[0]).toHaveProperty("email", application.email);

    });

    describe("Filter application results", () => {

        beforeEach(async () => {
            await CompanyApplication.create([pendingApplication, approvedApplication, rejectedApplication]);
        });

        afterEach(async () => {
            await CompanyApplication.deleteMany({});
        });

        test("Should filter by company name", async () => {
            const fullNameQuery = await test_agent
                .get(`/applications/company/search?companyName=${"approved Testing company"}`);

            expect(fullNameQuery.status).toBe(StatusCodes.OK);
            expect(fullNameQuery.body.applications).toHaveLength(1);
            expect(fullNameQuery.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);

            const partialNameQuery = await test_agent
                .get(`/applications/company/search?companyName=${"Testing company"}`);

            expect(partialNameQuery.status).toBe(StatusCodes.OK);
            expect(partialNameQuery.body.applications).toHaveLength(3);
            expect(partialNameQuery.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
            expect(partialNameQuery.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
            expect(partialNameQuery.body.applications[2]).toHaveProperty("companyName", rejectedApplication.companyName);
        });

        test("Should filter by state", async () => {

            const wrongFormatQuery = await test_agent
                .get(`/applications/company/search?state[]=<["${ApplicationStatus.APPROVED}"]`);

            expect(wrongFormatQuery.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
            expect(wrongFormatQuery.body.errors[0]).toStrictEqual({
                location: "query",
                msg: "must-be-in:[PENDING,APPROVED,REJECTED]", // FIXME: ValidationReasons.IN_ARRAY(ApplicationStatus),
                param: "state",
                value: [`<["${ApplicationStatus.APPROVED}"]`]
            });

            const singleStateQuery = await test_agent
                .get(`/applications/company/search?state[]=${ApplicationStatus.APPROVED}`)
                .expect(StatusCodes.OK);

            expect(singleStateQuery.body.applications.length).toBe(1);
            expect(singleStateQuery.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);

            const multiStateQuery = await test_agent
                .get("/applications/company/search?").query({ state: [ApplicationStatus.APPROVED, ApplicationStatus.PENDING] });

            expect(multiStateQuery.status).toBe(StatusCodes.OK);
            expect(multiStateQuery.body.applications.length).toBe(2);
            expect(multiStateQuery.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
            expect(multiStateQuery.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
        });

        test("Should filter by date", async () => {

            const afterQuery = await test_agent
                .get(`/applications/company/search?submissionDateFrom=${approvedApplication.submittedAt}`)
                .expect(StatusCodes.OK);

            expect(afterQuery.body.applications.length).toBe(2);
            expect(afterQuery.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
            expect(afterQuery.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);

            const untilQuery = await test_agent
                .get(`/applications/company/search?submissionDateTo=${approvedApplication.submittedAt}`)
                .expect(StatusCodes.OK);

            expect(untilQuery.body.applications.length).toBe(2);
            expect(untilQuery.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);
            expect(untilQuery.body.applications[1]).toHaveProperty("companyName", rejectedApplication.companyName);

            const intervalQuery = await test_agent
                .get("/applications/company/search?" +
                    `submissionDateFrom=${approvedApplication.submittedAt}&` +
                    `submissionDateTo=${approvedApplication.submittedAt}`);

            console.info(intervalQuery.body);

            expect(intervalQuery.status).toBe(StatusCodes.OK);
            expect(intervalQuery.body.applications.length).toBe(1);
            expect(intervalQuery.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);

        });
    });

    describe("Sort application results", () => {

        beforeEach(async () => {
            await CompanyApplication.create([pendingApplication, approvedApplication, rejectedApplication]);
        });

        afterEach(async () => {
            await CompanyApplication.deleteMany({});
        });

        test("Should sort by company name ascending", async () => {
            const query = await test_agent
                .get("/applications/company/search?sortBy=companyName:asc");

            expect(query.status).toBe(StatusCodes.OK);
            expect(query.body.applications.length).toBe(3);
            expect(query.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);
            expect(query.body.applications[1]).toHaveProperty("companyName", rejectedApplication.companyName);
            expect(query.body.applications[2]).toHaveProperty("companyName", pendingApplication.companyName);
        });

        test("Should sort by company name descending", async () => {
            const query = await test_agent
                .get("/applications/company/search?sortBy=companyName:desc");

            expect(query.status).toBe(StatusCodes.OK);
            expect(query.body.applications.length).toBe(3);
            expect(query.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
            expect(query.body.applications[1]).toHaveProperty("companyName", rejectedApplication.companyName);
            expect(query.body.applications[2]).toHaveProperty("companyName", approvedApplication.companyName);
        });

        test("Should sort by submissionDate descending", async () => {
            const defaultQuery = await test_agent
                .get("/applications/company/search");

            expect(defaultQuery.status).toBe(StatusCodes.OK);
            expect(defaultQuery.body.applications.length).toBe(3);
            expect(defaultQuery.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
            expect(defaultQuery.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
            expect(defaultQuery.body.applications[2]).toHaveProperty("companyName", rejectedApplication.companyName);

            const query = await test_agent
                .get("/applications/company/search?sortBy=submittedAt:desc");

            expect(query.status).toBe(StatusCodes.OK);
            expect(query.body.applications.length).toBe(3);
            expect(query.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
            expect(query.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
            expect(query.body.applications[2]).toHaveProperty("companyName", rejectedApplication.companyName);
        });
    });
});
