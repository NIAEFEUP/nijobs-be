const ERROR_TYPES = require("../../src/api/routes/errors/errorHandler");
const Account = require("../../src/models/Account");

describe("Register endpoint test", () => {

    beforeAll(async () => {
        await Account.deleteMany({});
    });

    test("Should return a malformed request (missing username)", async () => {
        const res = await request()
            .post("/auth/register")
            .send({});

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("error_code", ERROR_TYPES.MISSING_FIELD);
    });

    test("Should return a malformed request (missing password)", async () => {
        const res = await request()
            .post("/auth/register")
            .send({
                username: "user",
            });

        expect(res.status).toBe(400);
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("error_code", ERROR_TYPES.MISSING_FIELD);
    });

    test("Sould make a successful registration", async () => {
        const user = {
            username: "user",
            password: "password",
        };

        const res = await request()
            .post("/auth/register")
            .send(user);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("success", true);

        const registered_user = await Account.findOne({ username: user.username });
        expect(registered_user).toBeDefined();
        expect(registered_user).toHaveProperty("username", user.username);
    });
});

describe("Using already resgistered user", () => {
    const test_agent = agent();
    const test_user = {
        username: "user",
        password: "password",
    };

    beforeAll(async () => {
        await Account.deleteMany({});
        await Account.create([test_user]);
    });

    test("Stop registering of users with duplicate usernames", async () => {
        const res = await request()
            .post("/auth/register")
            .send(test_user);

        expect(res.status).toBe(500);
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("error_code", ERROR_TYPES.DB_ERROR);
    });

    test(
        "Should return forbidden when retrieving the information of the logged in user",
        async () => {
            const res = await request()
                .get("/auth/me")
                .send();

            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty("success", false);
        }
    );


    test("Log in with registered account", async () => {
        const res = await test_agent
            .post("/auth/login")
            .send(test_user);

        // TODO: Reimplement res.should.have.cookie("connect.sid");
        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("success", true);
    });

    test("Get logged in user info", async () => {
        const res = await test_agent
            .get("/auth/me")
            .send();

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("success", true);
        expect(res.body).toHaveProperty("data.username", test_user.username);
    });

    test("Log out with registered account", async () => {
        const res = await test_agent
            .delete("/auth/login")
            .send();

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("success", true);
    });

    test("Verify if the log out happen server side", async () => {
        const res = await test_agent
            .get("/auth/me")
            .send();

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("success", false);
    });
});
