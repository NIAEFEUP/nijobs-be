const { ErrorTypes } = require("../../src/api/middleware/errorHandler");
const Account = require("../../src/models/Account");

describe("Register endpoint test", () => {
    describe("Input Validation (unsuccessful registration)", () => {
        describe("username", () => {
            test("should be required", async () => {
                const res = await request()
                    .post("/auth/register")
                    .send({});

                expect(res.status).toBe(422);
                expect(res.body).toHaveProperty("success", false);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": "Username is required",
                    "param": "username",
                });
            });

            test("should be a String", async () => {
                const params = {
                    username: 123,
                };
                const res = await request()
                    .post("/auth/register")
                    .send(params);

                expect(res.status).toBe(422);
                expect(res.body).toHaveProperty("success", false);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": "Username must be a String",
                    "param": "username",
                    "value": params.username,
                });
            });
        });

        describe("password", () => {
            test("should be required", async () => {
                const res = await request()
                    .post("/auth/register")
                    .send({});

                expect(res.status).toBe(422);
                expect(res.body).toHaveProperty("success", false);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": "Password is required",
                    "param": "password",
                });
            });

            test("should be a String", async () => {
                const params = {
                    password: 123,
                };
                const res = await request()
                    .post("/auth/register")
                    .send(params);

                expect(res.status).toBe(422);
                expect(res.body).toHaveProperty("success", false);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": "Password must be a String",
                    "param": "password",
                    "value": params.password,
                });
            });

            test("should have more than 8 characters", async () => {
                const params = {
                    password: "12345",
                };
                const res = await request()
                    .post("/auth/register")
                    .send(params);

                expect(res.status).toBe(422);
                expect(res.body).toHaveProperty("success", false);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": "Password must have at least 8 characters",
                    "param": "password",
                    "value": params.password,
                });
            });

            test("should contain a number", async () => {
                const params = {
                    password: "password",
                };
                const res = await request()
                    .post("/auth/register")
                    .send(params);

                expect(res.status).toBe(422);
                expect(res.body).toHaveProperty("success", false);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": "Password must contain a number",
                    "param": "password",
                    "value": params.password,
                });
            });
        });
    });

    describe("Without pre-existing users", () => {
        beforeAll(async () => {
            await Account.deleteMany({});
        });

        test("Should make a successful registration", async () => {
            const user = {
                username: "user",
                password: "password123",
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

    test("Cannot register with an already existing username", async () => {
        const res = await request()
            .post("/auth/register")
            .send(test_user);

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty("success", false);
        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors).toContainEqual({
            "location": "body",
            "msg": "Username already exists",
            "param": "username",
            "value": test_user.username,
        });
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

    test("Verify if the log out happens server-side", async () => {
        const res = await test_agent
            .get("/auth/me")
            .send();

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty("success", false);
    });
});
