import { StatusCodes } from "http-status-codes";
import Account from "../../../../../src/models/Account";
import ValidatorTester from "../../../../utils/ValidatorTester";
import ValidationReasons from "../../../../../src/api/middleware/validators/validationReasons";
import hash from "../../../../../src/lib/passwordHashing";
import AccountConstants, { RECOVERY_LINK_EXPIRATION } from "../../../../../src/models/constants/Account";
import * as token from "../../../../../src/lib/token";
import env from "../../../../../src/config/env";
import { SECOND_IN_MS } from "../../../../../src/models/constants/TimeConstants";
import { generateToken } from "../../../../../src/lib/token";

const generateTokenSpy = jest.spyOn(token, "generateToken");
jest.spyOn(token, "verifyAndDecodeToken");

describe("GET /auth/recover/:token/confirm", () => {

    const test_account = {
        email: "recover_email@gmail.com",
        password: "password123",
    };

    beforeEach(async () => {
        await Account.deleteMany({ email: test_account.email });

        await Account.create({
            email: test_account.email,
            password: await hash(test_account.password),
            isAdmin: true,
        });

        jest.clearAllMocks();
    });

    test("should fail if invalid token", async () => {
        const res = await request()
            .get("/auth/recover/token/confirm");

        expect(res.status).toBe(StatusCodes.NOT_FOUND);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_TOKEN);
    });

    test("should accept if valid token", async () => {
        let res = await request()
            .post("/auth/recover/request")
            .send({ email: test_account.email });

        expect(token.generateToken).toHaveBeenCalledWith({ email: test_account.email }, env.jwt_secret, RECOVERY_LINK_EXPIRATION);

        const generatedToken = generateTokenSpy.mock.results[0].value;
        expect(res.status).toBe(StatusCodes.OK);

        res = await request()
            .get(`/auth/recover/${generatedToken}/confirm`);

        expect(res.status).toBe(StatusCodes.OK);
    });

    test("should fail if valid token expired", async () => {
        let res = await request()
            .post("/auth/recover/request")
            .send({ email: test_account.email });

        expect(token.generateToken).toHaveBeenCalledWith({ email: test_account.email }, env.jwt_secret, RECOVERY_LINK_EXPIRATION);

        const generatedToken = generateTokenSpy.mock.results[0].value;
        expect(res.status).toBe(StatusCodes.OK);


        const realTime = Date.now;
        const mockDate = Date.now() + (RECOVERY_LINK_EXPIRATION * SECOND_IN_MS);
        Date.now = () => mockDate;

        res = await request()
            .get(`/auth/recover/${generatedToken}/confirm`);

        expect(res.status).toBe(StatusCodes.FORBIDDEN);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.EXPIRED_TOKEN);

        Date.now = realTime;
    });
});

describe("POST /auth/recover/:token/confirm", () => {

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

    afterAll(async () => {
        await Account.deleteMany({});
    });

    describe("Input Validation", () => {
        describe("password", () => {
            let generatedToken;

            beforeAll(async () => {
                await request()
                    .post("/auth/recover/request")
                    .send({ email: test_account.email }).expect(StatusCodes.OK);

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
    });

    test("should fail if invalid token", async () => {
        const res = await request()
            .post("/auth/recover/token/confirm")
            .send({ password: newPassword });

        expect(res.status).toBe(StatusCodes.NOT_FOUND);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_TOKEN);
    });

    test("should accept if valid token", async () => {
        const generatedToken = generateToken({ email: test_account.email }, env.jwt_secret, RECOVERY_LINK_EXPIRATION);

        const res = await request()
            .post(`/auth/recover/${generatedToken}/confirm`)
            .send({ password: newPassword });

        expect(res.status).toBe(StatusCodes.OK);
    });

    test("should fail if valid token expired", async () => {

        const generatedToken = generateToken({ email: test_account.email }, env.jwt_secret, RECOVERY_LINK_EXPIRATION);

        const realTime = Date.now;
        const mockDate = Date.now() + (RECOVERY_LINK_EXPIRATION * SECOND_IN_MS);
        Date.now = () => mockDate;

        const res = await request()
            .post(`/auth/recover/${generatedToken}/confirm`)
            .send({ password: newPassword });

        expect(res.status).toBe(StatusCodes.FORBIDDEN);
        expect(res.body).toHaveProperty("errors");
        expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.EXPIRED_TOKEN);

        Date.now = realTime;
    });

    test("should succeed to complete the whole password recovery process", async () => {
        const generatedToken = generateToken({ email: test_account.email }, env.jwt_secret, RECOVERY_LINK_EXPIRATION);

        await request()
            .post(`/auth/recover/${generatedToken}/confirm`)
            .send({ password: newPassword })
            .expect(StatusCodes.OK);

        await request()
            .post("/auth/login")
            .send({ email: test_account.email, password: newPassword })
            .expect(StatusCodes.OK);

    });
});
