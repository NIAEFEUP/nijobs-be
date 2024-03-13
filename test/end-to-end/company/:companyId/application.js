import { StatusCodes } from "http-status-codes";
import CompanyApplication from "../../../../src/models/CompanyApplication";
import Account from "../../../../src/models/Account";
import Company from "../../../../src/models/Company.js";
import AccountService from "../../../../src/services/account.js";
import CompanyApplicationService from "../../../../src/services/application.js";
import withGodToken from "../../../utils/GodToken.js";
import hash from "../../../../src/lib/passwordHashing.js";


describe("GET /company/:companyId/application", () => {
    const test_agent = agent();

    let companyId;

    const test_user_company1 = {
        email: "company1@email.com",
        password: "password123",
    };

    describe("Testing permissions", () => {

        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };

        const test_user_company2 = {
            email: "company2@email.com",
            password: "password123",
        };

        beforeAll(async () => {
            await Account.deleteMany({});
            await Company.deleteMany({});
            await CompanyApplication.deleteMany({});
            await test_agent
                .delete("/auth/login");
            const accountService = new AccountService();
            await (new CompanyApplicationService()).create({
                email: test_user_company1.email,
                password: test_user_company1.password,
                companyName: "test company",
                motivation: "I want people for job :)"
            });
            await accountService.registerAdmin(test_user_admin.email, test_user_admin.password);
            await accountService.registerCompany(test_user_company1.email, await hash(test_user_company1.password), "test company");
            await accountService.registerCompany(test_user_company2.email, await hash(test_user_company2.password), "test company 2");

            companyId = (await Company.findOne({ name: "test company" }))._id;
        });


        afterEach(async () => {

            await test_agent
                .delete("/auth/login");
        });

        afterAll(async () => {
            await Account.deleteMany({});
            await Company.deleteMany({});
            await CompanyApplication.deleteMany({});
        });

        test("Should succeed if the user is logged in an admin account", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .get(`/company/${companyId.toString()}/application`);

            expect(res.status).toBe(StatusCodes.OK);
        });

        test("Should succeed if the user is logged in a god account", async () => {
            await test_agent.delete("/auth/login");
            await test_agent
                .post("/auth/login")
                .send(test_user_company1)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .get(`/company/${companyId}/application`)
                .send(withGodToken());

            expect(res.status).toBe(StatusCodes.OK);
        });

        test("Should succeed if the user is logged in to its company account", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_company1)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .get(`/company/${companyId}/application`);

            expect(res.status).toBe(StatusCodes.OK);
        });

        test("Should failed if the user is not logged in", async () => {
            await test_agent
                .get(`/company/${companyId}/application`).expect(StatusCodes.UNAUTHORIZED);

        });

        test("Should fail if the user is logged in to an account without access to the company", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_company2)
                .expect(StatusCodes.OK);

            await test_agent
                .get(`/company/${companyId}/application`)
                .expect(StatusCodes.UNAUTHORIZED);
        });
    });

    describe("Testing endpoint's result", () => {
        let application;
        const RealDateNow = Date.now;
        const mockCurrentDate = new Date("2019-11-23");
        beforeAll(async () => {
            await Account.deleteMany({});
            await Company.deleteMany({});
            await CompanyApplication.deleteMany({});
            await test_agent
                .delete("/auth/login");
            const accountService = new AccountService();

            Date.now = () => mockCurrentDate.getTime();

            application = await (new CompanyApplicationService()).create({
                email: test_user_company1.email,
                password: test_user_company1.password,
                companyName: "test company",
                motivation: "I want people for job :)",
            });
            await accountService.registerCompany(test_user_company1.email, await hash(test_user_company1.password), "test company");

            companyId = (await Company.findOne({ name: "test company" }))._id;
            Date.now = RealDateNow;
        });

        afterAll(async () => {
            await Account.deleteMany({});
            await Company.deleteMany({});
            await CompanyApplication.deleteMany({});
        });

        test("Should return the company's application", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_company1)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .get(`/company/${companyId}/application`)
                .expect(StatusCodes.OK);

            expect(res.body).toBeDefined();
            expect(res.body).toHaveProperty("email", application.email);
            expect(res.body).toHaveProperty("companyName", application.companyName);
            expect(res.body).toHaveProperty("motivation", application.motivation);
            expect(res.body).toHaveProperty("submittedAt", mockCurrentDate.toJSON());
            expect(res.body).not.toHaveProperty("password", application.password);
        });

    });
});
