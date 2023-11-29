import { StatusCodes } from "http-status-codes";
import hash from "../../../src/lib/passwordHashing";
import Account from "../../../src/models/Account";
import Company from "../../../src/models/Company";
import withGodToken from "../../utils/GodToken";

describe("GET /company", () => {

    const sanitizeCompany = (company) => ({ ...company.toObject(), _id: company._id.toString() });

    const test_agent = agent();

    beforeAll(async () => {
        await Company.deleteMany({});
    });

    afterAll(async () => {
        await Company.deleteMany({});
    });

    test("should return an empty array if there are no companies", async () => {
        const res = await request()
            .get("/company").expect(StatusCodes.OK);

        expect(res.body.companies).toEqual([]);
        expect(res.body.totalDocCount).toEqual(0);
    });

    describe("Without Auth", () => {

        const basicCompanyData = {
            name: "Company",
        };

        let company, blockedCompany, disabledCompany;

        beforeAll(async () => {
            await Company.deleteMany({});

            [
                company,
                blockedCompany,
                disabledCompany
            ] = await Company.create([
                basicCompanyData,
                { ...basicCompanyData, isBlocked: true },
                { ...basicCompanyData, isDisabled: true },
            ]);
        });

        afterAll(async () => {
            await Company.deleteMany({});
        });

        test("should return \"valid\" company", async () => {

            const res = await request()
                .get("/company")
                .expect(StatusCodes.OK);

            expect(res.body.companies).toContainEqual(sanitizeCompany(company));
        });

        describe("Blocked companies", () => {
            test("should not return blocked created company", async () => {

                const res = await request()
                    .get("/company")
                    .expect(StatusCodes.OK);

                expect(res.body.companies).not.toContainEqual(sanitizeCompany(blockedCompany));
            });
        });

        describe("Disabled companies", () => {
            test("should not return disabled created company", async () => {

                const res = await request()
                    .get("/company")
                    .expect(StatusCodes.OK);

                expect(res.body.companies).not.toContainEqual(sanitizeCompany(disabledCompany));
            });
        });
    });

    describe("With Auth", () => {

        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };
        const test_user_company = {
            email: "user@email.com",
            password: "password123"
        };

        const basicCompanyData = {
            name: "Company",
        };

        let company, blockedCompany, disabledCompany;

        beforeAll(async () => {

            await Company.deleteMany({});
            await Account.deleteMany({});

            await Account.create({
                email: test_user_admin.email,
                password: await hash(test_user_admin.password),
                isAdmin: true
            });

            [
                company,
                blockedCompany,
                disabledCompany
            ] = await Company.create([
                basicCompanyData,
                { ...basicCompanyData, isBlocked: true },
                { ...basicCompanyData, isDisabled: true },
            ]);

            await Account.create({
                email: test_user_company.email,
                password: await hash(test_user_company.password),
                company: company._id
            });
        });

        afterAll(async () => {
            await Company.deleteMany({});
            await Account.deleteMany({});
        });

        test("should only return \"valid\" company if logged in as company", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_company)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .get("/company")
                .expect(StatusCodes.OK);

            expect(res.body.companies).toEqual(expect.arrayContaining([
                sanitizeCompany(company),
            ]));

            expect(res.body.totalDocCount).toEqual(1);
        });

        test("should return every company if logged in as admin", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .get("/company")
                .expect(StatusCodes.OK);

            expect(res.body.companies).toEqual(expect.arrayContaining([
                sanitizeCompany(company),
                sanitizeCompany(blockedCompany),
                sanitizeCompany(disabledCompany),
            ]));

            expect(res.body.totalDocCount).toEqual(3);
        });

        test("should return every company if god token is sent", async () => {

            const res = await test_agent
                .get("/company")
                .send(withGodToken({}))
                .expect(StatusCodes.OK);

            expect(res.body.companies).toEqual(expect.arrayContaining([
                sanitizeCompany(company),
                sanitizeCompany(blockedCompany),
                sanitizeCompany(disabledCompany),
            ]));

            expect(res.body.totalDocCount).toEqual(3);
        });
    });
});
