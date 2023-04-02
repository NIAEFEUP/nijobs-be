import { StatusCodes } from "http-status-codes";
import Account from "../../../src/models/Account";
import ValidatorTester from "../../utils/ValidatorTester";
import withGodToken from "../../utils/GodToken";
import AccountConstants from "../../../src/models/constants/Account";
import { ErrorTypes } from "../../../src/api/middleware/errorHandler";
import ValidationReasons from "../../../src/api/middleware/validators/validationReasons";

describe("POST /auth/register", () => {

    describe("Input Validation", () => {
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

        afterAll(async () => {
            await Account.deleteMany({});
        });

        test("Should return forbidden if attempting to register an account while not providing the god token", async () => {
            const user = {
                email: "user@email.com",
                password: "password123",
            };

            const res = await request()
                .post("/auth/register")
                .send(user);

            expect(res.status).toBe(StatusCodes.UNAUTHORIZED);
        });

        test("Should make a successful registration if god token given and email not in use", async () => {
            const user = {
                email: "user@email.com",
                password: "password123",
            };

            const res = await request()
                .post("/auth/register")
                .send(withGodToken(user));

            expect(res.status).toBe(StatusCodes.OK);

            const registered_user = await Account.findOne({ email: user.email });
            expect(registered_user).toBeDefined();
            expect(registered_user).toHaveProperty("email", user.email);
        });

        test("should return an error when registering with an already existing email", async () => {

            const test_user = {
                email: "user@email.com",
                password: "password123",
            };

            const res = await request()
                .post("/auth/register")
                .send(withGodToken(test_user));

            expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors).toContainEqual({
                "location": "body",
                "msg": ValidationReasons.ALREADY_EXISTS("email"),
                "param": "email",
                "value": test_user.email,
            });
        });
    });
});
