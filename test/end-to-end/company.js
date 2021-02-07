const HTTPStatus = require("http-status-codes");
const Company = require("../../src/models/Company");

const getCompanies = async (options) => [
    ...(await Company
        .find(options)
        .exec())
]
    .map((c) => {
        const obj = c.toObject();
        obj._id = obj._id.toString();
        return obj;
    });

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
});
