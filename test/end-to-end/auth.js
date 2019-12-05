const { ErrorTypes } = require("../../src/api/middleware/errorHandler");
const Account = require("../../src/models/Account");

const test_god_token  = "testing_is_cool73";
describe("Register endpoint test", () => {
    describe("Input Validation (unsuccessful registration)", () => {
        describe("email", () => {
            test("should be required", async () => {
                const res = await request()
                    .post("/auth/register")
                    .send({
                        god_token: test_god_token,
                    });

                expect(res.status).toBe(422);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": "Email is required",
                    "param": "email",
                });
            });

            test("should be a valid email", async () => {
                const params = {
                    email: "@123",
                    password: "123456789",
                    god_token: test_god_token,

                };
                const res = await request()
                    .post("/auth/register")
                    .send(params);

                expect(res.status).toBe(422);
                expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
                expect(res.body).toHaveProperty("errors");
                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": "Email must be valid",
                    "param": "email",
                    "value": params.email,
                });
            });
        });

        describe("password", () => {
            test("should be required", async () => {
                const res = await request()
                    .post("/auth/register")
                    .send({
                        god_token: test_god_token,
                    });

                expect(res.status).toBe(422);
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
                    god_token: test_god_token,
                };
                const res = await request()
                    .post("/auth/register")
                    .send(params);

                expect(res.status).toBe(422);
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
                    god_token: test_god_token,
                };
                const res = await request()
                    .post("/auth/register")
                    .send(params);

                expect(res.status).toBe(422);
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
                    god_token: test_god_token,
                };
                const res = await request()
                    .post("/auth/register")
                    .send(params);

                expect(res.status).toBe(422);
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

        test("Should return forbidden", async () => {
            const user = {
                email: "user@email.com",
                password: "password123",
            };

            const res = await request()
                .post("/auth/register")
                .send(user);

            expect(res.status).toBe(401);
        });

        test("Should make a successful registration", async () => {
            const user = {
                email: "user@email.com",
                password: "password123",
                god_token: test_god_token,
            };

            const res = await request()
                .post("/auth/register")
                .send(user);

            expect(res.status).toBe(200);

            const registered_user = await Account.findOne({ email: user.email });
            expect(registered_user).toBeDefined();
            expect(registered_user).toHaveProperty("email", user.email);
        });
    });

});

describe("Using already resgistered user", () => {
    const test_agent = agent();
    const test_user = {
        email: "user@email.com",
        password: "password123",
        god_token: test_god_token,
    };

    beforeAll(async () => {
        await Account.deleteMany({});
        await Account.create({ email: test_user.email, password: test_user.password, isAdmin: true });
    });

    test("Cannot register with an already existing email", async () => {
        const res = await request()
            .post("/auth/register")
            .send(test_user);

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors).toContainEqual({
            "location": "body",
            "msg": "Email already exists",
            "param": "email",
            "value": test_user.email,
        });
    });

    test(
        "Should return forbidden when retrieving the information of the logged in user",
        async () => {
            const res = await request()
                .get("/auth/me")
                .send();

            expect(res.status).toBe(401);
        }
    );


    test("Log in with registered account", async () => {
        const res = await test_agent
            .post("/auth/login")
            .send(test_user);

        // TODO: Reimplement res.should.have.cookie("connect.sid");
        expect(res.status).toBe(200);
    });

    test("Get logged in user info", async () => {
        const res = await test_agent
            .get("/auth/me")
            .send();

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("data.email", test_user.email);
    });

    test("Log out with registered account", async () => {
        const res = await test_agent
            .delete("/auth/login")
            .send();

        expect(res.status).toBe(200);
    });

    test("Verify if the log out happens server-side", async () => {
        const res = await test_agent
            .get("/auth/me")
            .send();

        expect(res.status).toBe(401);
    });
});
