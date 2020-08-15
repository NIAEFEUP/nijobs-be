const HTTPStatus = require("http-status-codes");
const CompanyApplication = require("../../src/models/CompanyApplication");
const { APPROVED, PENDING } = require("../../src/models/constants/ApplicationStatus");

describe("Company application review endpoint test", () => {

    describe("/applications/company", () => {

        beforeEach(async () => {
            await CompanyApplication.deleteMany({});
        });

        test("Should list existing applications", async () => {
            const emptyRes = await request()
                .get("/applications/company/search");

            expect(emptyRes.status).toBe(HTTPStatus.OK);
            expect(emptyRes.body).toEqual([]);

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

            const nonEmptyRes = await request()
                .get("/applications/company/search");

            expect(nonEmptyRes.status).toBe(HTTPStatus.OK);
            expect(nonEmptyRes.body.length).toBe(1);
            expect(nonEmptyRes.body[0]).toHaveProperty("email", application.email);

        });

        describe("Filter application results", () => {

            const pendingApplication = {
                email: "test2@test.com",
                password: "password123",
                companyName: "Testing company",
                motivation: "This company has a very valid motivation, because otherwise the tests would not exist.",
                submittedAt: new Date("2019-11-25"),
            };

            const approvedApplication = {
                ...pendingApplication,
                submittedAt: new Date("2019-11-24"),
                approvedAt: pendingApplication.submittedAt.getTime() + 1,
                companyName: "approved Testing company",
                email: `approved${pendingApplication.email}`,
            };
            const rejectedApplication = { ...pendingApplication,
                submittedAt: new Date("2019-11-23"),
                rejectedAt: pendingApplication.submittedAt.getTime() + 1,
                companyName: "rejected Testing company",
                email: `rejected${pendingApplication.email}`,
                rejectReason: "2bad4nij0bs",
            };

            beforeEach(async () => {
                await CompanyApplication.create(pendingApplication);
                await CompanyApplication.create(approvedApplication);
                await CompanyApplication.create(rejectedApplication);
            });

            afterEach(async () => {
                await CompanyApplication.deleteMany({});
            });

            test("Should filter by company name", async () => {
                const fullNameQuery = await request()
                    .get("/applications/company/search")
                    .send({ filters: { companyName: "approved Testing company" } });

                expect(fullNameQuery.status).toBe(HTTPStatus.OK);
                expect(fullNameQuery.body.length).toBe(1);
                expect(fullNameQuery.body[0]).toHaveProperty("companyName", approvedApplication.companyName);

                const partialNameQuery = await request()
                    .get("/applications/company/search")
                    .send({ filters: { companyName: "Testing company" } });

                expect(partialNameQuery.status).toBe(HTTPStatus.OK);
                expect(partialNameQuery.body.length).toBe(3);
                expect(partialNameQuery.body[0]).toHaveProperty("companyName", pendingApplication.companyName);
                expect(partialNameQuery.body[1]).toHaveProperty("companyName", approvedApplication.companyName);
                expect(partialNameQuery.body[2]).toHaveProperty("companyName", rejectedApplication.companyName);
            });

            test("Should filter by state", async () => {
                const singleStateQuery = await request()
                    .get("/applications/company/search")
                    .send({ filters: { state: APPROVED } });

                expect(singleStateQuery.status).toBe(HTTPStatus.OK);
                expect(singleStateQuery.body.length).toBe(1);
                expect(singleStateQuery.body[0]).toHaveProperty("companyName", approvedApplication.companyName);

                const multiStateQuery = await request()
                    .get("/applications/company/search")
                    .send({ filters: { state: [APPROVED, PENDING] } });

                expect(multiStateQuery.status).toBe(HTTPStatus.OK);
                expect(multiStateQuery.body.length).toBe(2);
                expect(multiStateQuery.body[0]).toHaveProperty("companyName", pendingApplication.companyName);
                expect(multiStateQuery.body[1]).toHaveProperty("companyName", approvedApplication.companyName);
            });

            test("Should filter by date", async () => {

                const afterQuery = await request()
                    .get("/applications/company/search")
                    .send({ filters: { submissionDate: { from: approvedApplication.submittedAt } } });

                expect(afterQuery.status).toBe(HTTPStatus.OK);
                expect(afterQuery.body.length).toBe(2);
                expect(afterQuery.body[0]).toHaveProperty("companyName", pendingApplication.companyName);
                expect(afterQuery.body[1]).toHaveProperty("companyName", approvedApplication.companyName);

                const untilQuery = await request()
                    .get("/applications/company/search")
                    .send({ filters: { submissionDate: { to: approvedApplication.submittedAt } } });

                expect(untilQuery.status).toBe(HTTPStatus.OK);
                expect(untilQuery.body.length).toBe(2);
                expect(untilQuery.body[0]).toHaveProperty("companyName", approvedApplication.companyName);
                expect(untilQuery.body[1]).toHaveProperty("companyName", rejectedApplication.companyName);

                const intervalQuery = await request()
                    .get("/applications/company/search")
                    .send({
                        filters: {
                            submissionDate: {
                                from: approvedApplication.submittedAt,
                                to: approvedApplication.submittedAt,
                            },
                        },
                    });

                expect(intervalQuery.status).toBe(HTTPStatus.OK);
                expect(intervalQuery.body.length).toBe(1);
                expect(intervalQuery.body[0]).toHaveProperty("companyName", approvedApplication.companyName);

            });

        });
    });
});
