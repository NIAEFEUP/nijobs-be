const HTTPStatus = require("http-status-codes");
const CompanyApplication = require("../../src/models/CompanyApplication");

describe("Company application review endpoint test", () => {

    describe("/applications/company", () => {

        beforeAll(async () => {
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

        test("Should filter application results", async () => {
            // TODO
        });
    });
});
