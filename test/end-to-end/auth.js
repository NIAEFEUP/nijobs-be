import { StatusCodes as HTTPStatus } from "http-status-codes";
import { ErrorTypes } from "../../src/api/middleware/errorHandler";
import Account from "../../src/models/Account";
import ValidatorTester from "../utils/ValidatorTester";
import withGodToken from "../utils/GodToken";
import ValidationReasons from "../../src/api/middleware/validators/validationReasons";
import hash from "../../src/lib/passwordHashing";
import AccountConstants, { RECOVERY_LINK_EXPIRATION } from "../../src/models/constants/Account";
import Company from "../../src/models/Company";
import EmailService from "../../src/lib/emailService";
import * as token from "../../src/lib/token";
import { REQUEST_ACCOUNT_RECOVERY } from "../../src/email-templates/accountManagement";
import env from "../../src/config/env";
import { SECOND_IN_MS } from "../../src/models/constants/TimeConstants";

const generateTokenSpy = jest.spyOn(token, "generateToken");
jest.spyOn(token, "verifyAndDecodeToken");

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
        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
        };
        const test_user_company = {
            email: "company@email.com",
            password: "password123",
        };
        let test_company;

        beforeAll(async () => {
            await Account.deleteMany({});
            await Account.create({ email: test_user_admin.email, password: await hash(test_user_admin.password), isAdmin: true });
            test_company = await Company.create({ name: "test comapny" });
            await Account.create({
                email: test_user_company.email,
                password: await hash(test_user_admin.password),
                company: test_company._id });
        });

        test("should return an error when registering with an already existing email", async () => {
            const res = await request()
                .post("/auth/register")
                .send(withGodToken(test_user_admin));

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": "body",
                "msg": ValidationReasons.ALREADY_EXISTS("email"),
                "param": "email",
                "value": test_user_admin.email,
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
                .send(test_user_admin);

            // TODO: Reimplement res.should.have.cookie("connect.sid");
            expect(res.status).toBe(HTTPStatus.OK);
        });

        test("should return the information of the logged in user (admin)", async () => {

            await test_agent
                .post("/auth/login")
                .send(test_user_admin);

            const res = await test_agent
                .get("/auth/me")
                .send();

            expect(res.status).toBe(HTTPStatus.OK);
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

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body).toHaveProperty("data.email", test_user_company.email);
            expect(res.body).toHaveProperty("data.isAdmin", false);
            expect(res.body).toHaveProperty("data.company", expect.objectContaining(
                JSON.parse(JSON.stringify(test_company.toObject())) // Necessary since mongoose objects don't play well with jest...
            ));
        });

        test("should be successful when logging out the current user", async () => {
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

    describe("Using logged out user", () => {
        const logged_out_agent = agent();

        test("should return OK since the logout is idempotent", async () => {
            const res = await logged_out_agent
                .delete("/auth/login")
                .send();

            expect(res.status).toBe(HTTPStatus.OK);
        });
    });
});

describe("Password recovery endpoint test", () => {
    const test_account = {
        email: "recover_email@gmail.com",
        password: "password123",
    };

    const newPassword = "new_password_123";

    beforeEach(async () => {
        await Account.deleteMany({ email: test_account.email });
        await Account.create({
            email: test_account.email,
            password: await hash(test_account.password),
            isAdmin: true,
        });
        jest.clearAllMocks();
    });

    describe("POST /auth/recover/request", () => {
        describe("email", () => {
            const EndpointValidatorTester = ValidatorTester((params) => request().post("/auth/recover/request").send(params));
            const BodyValidatorTester = EndpointValidatorTester("body");
            const FieldValidatorTester = BodyValidatorTester("email");
            FieldValidatorTester.isRequired();
            FieldValidatorTester.mustBeEmail();
        });

        test("should return ok and not send email nor generate a token if account not found", async () => {
            const res = await request()
                .post("/auth/recover/request")
                .send({ email: "not_valid_email@email.com" });

            expect(EmailService.sendMail).not.toHaveBeenCalled();
            expect(token.generateToken).not.toHaveBeenCalled();

            expect(res.status).toBe(HTTPStatus.OK);
        });

        test("should generate token and send email if account found", async () => {
            const res = await request()
                .post("/auth/recover/request")
                .send({ email: test_account.email });
            expect(res.status).toBe(HTTPStatus.OK);

            expect(token.generateToken).toHaveBeenCalledWith({ email: test_account.email }, env.jwt_secret, RECOVERY_LINK_EXPIRATION);

            const generatedToken = generateTokenSpy.mock.results[0].value;

            const emailOptions = REQUEST_ACCOUNT_RECOVERY(`${env.password_recovery_link}/${generatedToken}`);
            expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: emailOptions.subject,
                to: test_account.email,
                template: emailOptions.template,
                context: emailOptions.context,
            }));

            expect(res.status).toBe(HTTPStatus.OK);
        });
    });

    describe("GET /auth/recover/:token/confirm", () => {
        test("should fail if invalid token", async () => {
            const res = await request()
                .get("/auth/recover/token/confirm");

            expect(res.status).toBe(HTTPStatus.NOT_FOUND);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_TOKEN);
        });

        test("should accept if valid token", async () => {
            let res = await request()
                .post("/auth/recover/request")
                .send({ email: test_account.email });

            expect(token.generateToken).toHaveBeenCalledWith({ email: test_account.email }, env.jwt_secret, RECOVERY_LINK_EXPIRATION);

            const generatedToken = generateTokenSpy.mock.results[0].value;
            expect(res.status).toBe(HTTPStatus.OK);

            res = await request()
                .get(`/auth/recover/${generatedToken}/confirm`);

            expect(res.status).toBe(HTTPStatus.OK);
        });

        test("should fail if valid token expired", async () => {
            let res = await request()
                .post("/auth/recover/request")
                .send({ email: test_account.email });

            expect(token.generateToken).toHaveBeenCalledWith({ email: test_account.email }, env.jwt_secret, RECOVERY_LINK_EXPIRATION);

            const generatedToken = generateTokenSpy.mock.results[0].value;
            expect(res.status).toBe(HTTPStatus.OK);


            const realTime = Date.now;
            const mockDate = Date.now() + (RECOVERY_LINK_EXPIRATION * SECOND_IN_MS);
            Date.now = () => mockDate;

            res = await request()
                .get(`/auth/recover/${generatedToken}/confirm`);

            expect(res.status).toBe(HTTPStatus.GONE);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.EXPIRED_TOKEN);

            Date.now = realTime;
        });
    });

    describe("POST /auth/recover/:token/confirm", () => {
        test("should fail if invalid token", async () => {
            const res = await request()
                .post("/auth/recover/token/confirm")
                .send({ password: newPassword });

            expect(res.status).toBe(HTTPStatus.NOT_FOUND);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_TOKEN);
        });

        test("should accept if valid token", async () => {
            let res = await request()
                .post("/auth/recover/request")
                .send({ email: test_account.email });

            expect(token.generateToken).toHaveBeenCalledWith({ email: test_account.email }, env.jwt_secret, RECOVERY_LINK_EXPIRATION);

            const generatedToken = generateTokenSpy.mock.results[0].value;
            expect(res.status).toBe(HTTPStatus.OK);

            res = await request()
                .post(`/auth/recover/${generatedToken}/confirm`)
                .send({ password: newPassword });

            expect(res.status).toBe(HTTPStatus.OK);
        });

        test("should fail if valid token expired", async () => {
            let res = await request()
                .post("/auth/recover/request")
                .send({ email: test_account.email });

            expect(token.generateToken).toHaveBeenCalledWith({ email: test_account.email }, env.jwt_secret, RECOVERY_LINK_EXPIRATION);

            const generatedToken = generateTokenSpy.mock.results[0].value;
            expect(res.status).toBe(HTTPStatus.OK);


            const realTime = Date.now;
            const mockDate = Date.now() + (RECOVERY_LINK_EXPIRATION * SECOND_IN_MS);
            Date.now = () => mockDate;

            res = await request()
                .post(`/auth/recover/${generatedToken}/confirm`)
                .send({ password: newPassword });

            expect(res.status).toBe(HTTPStatus.GONE);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.EXPIRED_TOKEN);

            Date.now = realTime;
        });

        describe("password", () => {
            let generatedToken;

            beforeAll(async () => {
                await request()
                    .post("/auth/recover/request")
                    .send({ email: test_account.email });

                expect(token.generateToken).toHaveBeenCalledWith({ email: test_account.email }, env.jwt_secret, RECOVERY_LINK_EXPIRATION);

                generatedToken = generateTokenSpy.mock.results[0].value;
            });

            const EndpointValidatorTester =
                ValidatorTester((params) => request().post(`/auth/recover/${generatedToken}/confirm`).send(params));
            const BodyValidatorTester = EndpointValidatorTester("body");
            const FieldValidatorTester = BodyValidatorTester("password");
            FieldValidatorTester.isRequired();
            FieldValidatorTester.mustBeString();
            FieldValidatorTester.hasMinLength(AccountConstants.password.min_length);
            FieldValidatorTester.hasNumber();
        });

        test("should succeed to complete the whole password recovery process", async () => {
            const test_agent = agent();
            let res = await test_agent
                .post("/auth/login")
                .send(test_account);

            expect(res.status).toBe(HTTPStatus.OK);

            await test_agent.delete("/auth/login");

            res = await request()
                .post("/auth/recover/request")
                .send({ email: test_account.email });

            expect(res.status).toBe(HTTPStatus.OK);
            const generatedToken = generateTokenSpy.mock.results[0].value;

            res = await request()
                .post(`/auth/recover/${generatedToken}/confirm`)
                .send({ password: newPassword });

            expect(res.status).toBe(HTTPStatus.OK);

            res = await test_agent
                .post("/auth/login")
                .send({ email: test_account.email, password: newPassword });

            expect(res.status).toBe(HTTPStatus.OK);

        });

        test("should change password in database after whole password recovery process", async () => {
            const oldPassword = (await Account.findOne({ email: test_account.email })).password;

            const test_agent = agent();
            let res = await test_agent
                .post("/auth/login")
                .send(test_account);

            expect(res.status).toBe(HTTPStatus.OK);

            await test_agent.delete("/auth/login");

            res = await request()
                .post("/auth/recover/request")
                .send({ email: test_account.email });

            expect(res.status).toBe(HTTPStatus.OK);
            const generatedToken = generateTokenSpy.mock.results[0].value;

            res = await request()
                .post(`/auth/recover/${generatedToken}/confirm`)
                .send({ password: newPassword });

            expect(res.status).toBe(HTTPStatus.OK);

            const password = (await Account.findOne({ email: test_account.email })).password;

            expect(password).not.toBe(oldPassword);

        });
    });

});
