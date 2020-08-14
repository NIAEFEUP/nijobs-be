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
                submittedAt: Date.now(),
            };

            const approvedApplication = {
                ...pendingApplication,
                approvedAt: Date.now() + 1,
                companyName: "approved Testing company",
                email: `approved${pendingApplication.email}`,
            };
            const rejectedApplication = { ...pendingApplication,
                rejectedAt: Date.now() + 1,
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

            });

        });
    });
});
