const HTTPStatus = require("http-status-codes");
const { ErrorTypes } = require("../../src/api/middleware/errorHandler");
const Account = require("../../src/models/Account");
const ValidatorTester = require("../utils/ValidatorTester");
const withGodToken = require("../utils/GodToken");
const ValidationReasons = require("../../src/api/middleware/validators/validationReasons");
const hash = require("../../src/lib/passwordHashing");
const AccountConstants = require("../../src/models/constants/Account");

describe("Register endpoint test", () => {
    describe("Input Validation (unsuccessful registration)", () => {
        const EndpointValidatorTester = ValidatorTester((params) => request().post("/auth/register").send(withGodToken(params)));
        const BodyValidatorTester = EndpointValidatorTester("body");
        describe("email", () => {
            const FieldValidatorTester = BodyValidatorTester("email");
            FieldValidatorTester.isRequired();
            FieldValidatorTester.mustBeEmail();
        });

        describe("password", () => {
            const FieldValidatorTester = BodyValidatorTester("password");
            FieldValidatorTester.isRequired();
            FieldValidatorTester.mustBeString();
            FieldValidatorTester.hasMinLength(AccountConstants.password.min_length);
            FieldValidatorTester.hasNumber();
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

            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
        });

        test("Should make a successful registration", async () => {
            const user = {
                email: "user@email.com",
                password: "password123",
            };

            const res = await request()
                .post("/auth/register")
                .send(withGodToken(user));

            expect(res.status).toBe(HTTPStatus.OK);

            const registered_user = await Account.findOne({ email: user.email });
            expect(registered_user).toBeDefined();
            expect(registered_user).toHaveProperty("email", user.email);
        });
    });

});

describe("Login endpoint test", () => {
    describe("Input Validation", () => {
        const EndpointValidatorTester = ValidatorTester((params) => request().post("/auth/login").send(withGodToken(params)));
        const BodyValidatorTester = EndpointValidatorTester("body");
        describe("email", () => {
            const FieldValidatorTester = BodyValidatorTester("email");
            FieldValidatorTester.isRequired();
            FieldValidatorTester.mustBeEmail();
        });

        describe("password", () => {
            const FieldValidatorTester = BodyValidatorTester("password");
            FieldValidatorTester.isRequired();
            FieldValidatorTester.mustBeString();
        });
    });

    describe("Using already resgistered user", () => {
        const test_agent = agent();
        const test_user = {
            email: "user@email.com",
            password: "password123",
        };

        beforeAll(async () => {
            await Account.deleteMany({});
            await Account.create({ email: test_user.email, password: await hash(test_user.password), isAdmin: true });
        });

        test("should return an error when registering with an already existing email", async () => {
            const res = await request()
                .post("/auth/register")
                .send(withGodToken(test_user));

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": "body",
                "msg": ValidationReasons.ALREADY_EXISTS("email"),
                "param": "email",
                "value": test_user.email,
            });
        });

        test("should return forbidden when retrieving the information of the logged in user",
            async () => {
                const res = await request()
                    .get("/auth/me")
                    .send();

                expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
            }
        );

        test("should unsuccessfully login with registered account (wrong password)", async () => {
            const res = await test_agent
                .post("/auth/login")
                .send({
                    email: "user@gmail.com",
                    password: "password",
                });

            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
        });


        test("should successfully login with registered account", async () => {
            const res = await test_agent
                .post("/auth/login")
                .send(test_user);

            // TODO: Reimplement res.should.have.cookie("connect.sid");
            expect(res.status).toBe(HTTPStatus.OK);
        });

        test("should return the informations of the logged in user", async () => {
            const res = await test_agent
                .get("/auth/me")
                .send();

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body).toHaveProperty("data.email", test_user.email);
            expect(res.body).toHaveProperty("data.isAdmin", true);
            expect(res.body).not.toHaveProperty("data.company");
        });

        test("should be successful when loging out the current user", async () => {
            const res = await test_agent
                .delete("/auth/login")
                .send();

            expect(res.status).toBe(HTTPStatus.OK);
        });

        test("should return an error since no user is logged in", async () => {
            const res = await test_agent
                .get("/auth/me")
                .send();

            expect(res.status).toBe(HTTPStatus.UNAUTHORIZED);
        });
    });
});
