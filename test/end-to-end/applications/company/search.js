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
        await Account.create({
            email: test_user_admin.email,
            password: await hash(test_user_admin.password),
            isAdmin: true
        });
    });

    beforeEach(async () => {
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

        await request()
            .get("/applications/company/search")
            .expect(StatusCodes.UNAUTHORIZED);
    });

    test("Should return empty list if no applications exist", async () => {

        await CompanyApplication.deleteMany({});

        const emptyRes = await test_agent
            .get("/applications/company/search")
            .expect(StatusCodes.OK);

        expect(emptyRes.body.applications).toEqual([]);
    });

    test("Should list existing applications", async () => {
        await CompanyApplication.create({
            ...pendingApplication,
            submittedAt: Date.now(),
        });

        const nonEmptyRes = await test_agent
            .get("/applications/company/search");

        expect(nonEmptyRes.status).toBe(StatusCodes.OK);
        expect(nonEmptyRes.body.applications.length).toBe(1);
        expect(nonEmptyRes.body.applications[0]).toHaveProperty("email", pendingApplication.email);
    });

    describe("Filter application results", () => {

        beforeAll(async () => {
            await CompanyApplication.deleteMany({});
        });

        afterAll(async () => {
            await CompanyApplication.deleteMany({});
        });

        beforeEach(async () => {
            await CompanyApplication.create([pendingApplication, approvedApplication, rejectedApplication]);
        });

        afterEach(async () => {
            await CompanyApplication.deleteMany({});
        });

        describe("Should filter by company name", () => {

            test("Should filter by company name with full name query", async () => {
                const res = await test_agent
                    .get("/applications/company/search")
                    .query({
                        companyName: approvedApplication.companyName
                    })
                    .expect(StatusCodes.OK);

                expect(res.body.applications).toHaveLength(1);
                expect(res.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);
            });

            test("Should filter by company name with partial name query", async () => {
                const res = await test_agent
                    .get("/applications/company/search")
                    .query({
                        companyName: "Testing company"
                    })
                    .expect(StatusCodes.OK);

                expect(res.body.applications).toHaveLength(3);
                expect(res.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
                expect(res.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
                expect(res.body.applications[2]).toHaveProperty("companyName", rejectedApplication.companyName);
            });
        });

        describe("Should filter by state", () => {

            test("Should fail with badly formatted query", async () => {

                const res = await test_agent
                    // FIXME: having only one element makes it so that state is parsed as a single value
                    .get(`/applications/company/search?state[]=<["${ApplicationStatus.APPROVED}"]`)
                    .expect(StatusCodes.UNPROCESSABLE_ENTITY);

                expect(res.body.errors[0]).toStrictEqual({
                    location: "query",
                    msg: "must-be-in:[PENDING,APPROVED,REJECTED]", // FIXME: ValidationReasons.IN_ARRAY(ApplicationStatus),
                    param: "state",
                    value: [`<["${ApplicationStatus.APPROVED}"]`]
                });
            });

            test("Should succeed with single state query", async () => {

                const res = await test_agent
                    .get(`/applications/company/search?state[]=${ApplicationStatus.APPROVED}`)
                    .expect(StatusCodes.OK);

                expect(res.body.applications.length).toBe(1);
                expect(res.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);

            });

            test("Should succeed with multi state query", async () => {
                const res = await test_agent
                    .get("/applications/company/search")
                    .query({
                        state: [
                            ApplicationStatus.APPROVED,
                            ApplicationStatus.PENDING
                        ]
                    })
                    .expect(StatusCodes.OK);

                expect(res.body.applications.length).toBe(2);
                expect(res.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
                expect(res.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
            });
        });

        describe("Should filter by date", () => {

            test("Should succeed when searching after date", async () => {
                const res = await test_agent
                    .get("/applications/company/search")
                    .query({
                        submissionDateFrom: approvedApplication.submittedAt
                    })
                    .expect(StatusCodes.OK);

                expect(res.body.applications.length).toBe(2);
                expect(res.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
                expect(res.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
            });

            test("Should succeed when searching before date", async () => {
                const res = await test_agent
                    .get("/applications/company/search")
                    .query({
                        submissionDateTo: approvedApplication.submittedAt
                    })
                    .expect(StatusCodes.OK);

                expect(res.body.applications.length).toBe(2);
                expect(res.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);
                expect(res.body.applications[1]).toHaveProperty("companyName", rejectedApplication.companyName);
            });

            test("Should succeed when searching between dates", async () => {
                const res = await test_agent
                    .get("/applications/company/search?" +
                        `submissionDateFrom=${approvedApplication.submittedAt}&` +
                        `submissionDateTo=${approvedApplication.submittedAt}`);

                expect(res.status).toBe(StatusCodes.OK);
                expect(res.body.applications.length).toBe(1);
                expect(res.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);
            });
        });
    });

    describe("Sort application results", () => {

        const buildOrderingParam = (field, order = undefined) => `${field}${order ? `:${order}` : ""}`;

        beforeAll(async () => {
            await CompanyApplication.deleteMany({});
        });

        afterAll(async () => {
            await CompanyApplication.deleteMany({});
        });

        beforeEach(async () => {
            await CompanyApplication.create([pendingApplication, approvedApplication, rejectedApplication]);
        });

        afterEach(async () => {
            await CompanyApplication.deleteMany({});
        });

        describe("Should sort by company name", () => {

            test("Should sort by company name using default ordering", async () => {
                const res = await test_agent
                    .get("/applications/company/search")
                    .query({
                        sortBy: buildOrderingParam("companyName")
                    })
                    .expect(StatusCodes.OK);

                expect(res.body.applications).toHaveLength(3);
                expect(res.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
                expect(res.body.applications[1]).toHaveProperty("companyName", rejectedApplication.companyName);
                expect(res.body.applications[2]).toHaveProperty("companyName", approvedApplication.companyName);
            });

            test("Should sort by company name in descending order", async () => {
                const res = await test_agent
                    .get("/applications/company/search")
                    .query({
                        sortBy: buildOrderingParam("companyName", "desc")
                    })
                    .expect(StatusCodes.OK);

                expect(res.body.applications).toHaveLength(3);
                expect(res.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
                expect(res.body.applications[1]).toHaveProperty("companyName", rejectedApplication.companyName);
                expect(res.body.applications[2]).toHaveProperty("companyName", approvedApplication.companyName);
            });

            test("Should sort by company name in ascending order", async () => {
                const res = await test_agent
                    .get("/applications/company/search")
                    .query({
                        sortBy: buildOrderingParam("companyName", "asc")
                    })
                    .expect(StatusCodes.OK);

                expect(res.body.applications).toHaveLength(3);
                expect(res.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);
                expect(res.body.applications[1]).toHaveProperty("companyName", rejectedApplication.companyName);
                expect(res.body.applications[2]).toHaveProperty("companyName", pendingApplication.companyName);
            });
        });

        describe("Should sort by submission date", () => {

            test("Should sort by submission date using default ordering", async () => {
                const res = await test_agent
                    .get("/applications/company/search")
                    .query({
                        sortBy: buildOrderingParam("submittedAt")
                    })
                    .expect(StatusCodes.OK);

                expect(res.body.applications).toHaveLength(3);
                expect(res.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
                expect(res.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
                expect(res.body.applications[2]).toHaveProperty("companyName", rejectedApplication.companyName);
            });

            test("Should sort by submission date in descending order", async () => {
                const res = await test_agent
                    .get("/applications/company/search")
                    .query({
                        sortBy: buildOrderingParam("submittedAt", "desc")
                    })
                    .expect(StatusCodes.OK);

                expect(res.body.applications).toHaveLength(3);
                expect(res.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
                expect(res.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
                expect(res.body.applications[2]).toHaveProperty("companyName", rejectedApplication.companyName);
            });

            test("Should sort by submission date in ascending order", async () => {
                const res = await test_agent
                    .get("/applications/company/search")
                    .query({
                        sortBy: buildOrderingParam("submittedAt", "asc")
                    })
                    .expect(StatusCodes.OK);

                expect(res.body.applications).toHaveLength(3);
                expect(res.body.applications[0]).toHaveProperty("companyName", rejectedApplication.companyName);
                expect(res.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
                expect(res.body.applications[2]).toHaveProperty("companyName", pendingApplication.companyName);
            });
        });
    });
});
