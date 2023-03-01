import { StatusCodes } from "http-status-codes";
import Account from "../../../src/models/Account";
import Company from "../../../src/models/Company";
import hash from "../../../src/lib/passwordHashing";

describe("GET /auth/me", () => {

    const test_agent = agent();

    const test_user_admin = {
        email: "admin@email.com",
        password: "password123"
    };

    const test_user_company = {
        email: "company@email.com",
        password: "password123",
    };

    let test_company;

    beforeAll(async () => {
        await Account.deleteMany({});
        await Company.deleteMany({});

        await Account.create({
            email: test_user_admin.email,
            password: await hash(test_user_admin.password),
            isAdmin: true
        });

        test_company = await Company.create({ name: "test company" });

        await Account.create({
            email: test_user_company.email,
            password: await hash(test_user_company.password),
            company: test_company._id
        });
    });

    afterAll(async () => {
        await Account.deleteMany({});
        await Company.deleteMany({});
    });


    afterEach(async () => {
        await test_agent
            .delete("/auth/login")
            .send()
            .expect(StatusCodes.OK);
    });

    afterAll(async () => {
        await Account.deleteMany({});
        await Company.deleteMany({});
    });

    test("should return the information of the logged in user (admin)", async () => {

        await test_agent
            .post("/auth/login")
            .send(test_user_admin);

        const res = await test_agent
            .get("/auth/me")
            .send();

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body).toHaveProperty("data.email", test_user_admin.email);
        expect(res.body).toHaveProperty("data.isAdmin", true);
        expect(res.body).not.toHaveProperty("data.company");
    });

    test("should return the information of the logged in user (company)", async () => {
        await test_agent
            .post("/auth/login")
            .send(test_user_company);

        const res = await test_agent
            .get("/auth/me")
            .send();

        expect(res.status).toBe(StatusCodes.OK);
        expect(res.body).toHaveProperty("data.email", test_user_company.email);
        expect(res.body).toHaveProperty("data.isAdmin", false);
        expect(res.body).toHaveProperty("data.company", expect.objectContaining(
            JSON.parse(JSON.stringify(test_company.toObject()) // Necessary since mongoose objects don't play well with jest...
            )));
    });

    test("should return an error since no user is logged in", async () => {
        const res = await test_agent
            .get("/auth/me")
            .send();

        expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
    });
});
