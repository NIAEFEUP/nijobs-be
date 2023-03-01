import { StatusCodes } from "http-status-codes";
import ValidatorTester from "../../../utils/ValidatorTester";
import { RECOVERY_LINK_EXPIRATION } from "../../../../src/models/constants/Account";
import EmailService from "../../../../src/lib/emailService";
import * as token from "../../../../src/lib/token";
import { REQUEST_ACCOUNT_RECOVERY } from "../../../../src/email-templates/accountManagement";
import env from "../../../../src/config/env";
import Account from "../../../../src/models/Account";
import hash from "../../../../src/lib/passwordHashing";

const generateTokenSpy = jest.spyOn(token, "generateToken");
jest.spyOn(token, "verifyAndDecodeToken");

describe("POST /recover/request", () => {

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

    afterAll(async () => {
        await Account.deleteMany({});
    });

    describe("Input Validation", () => {
        describe("email", () => {
            const EndpointValidatorTester = ValidatorTester((params) => request().post("/auth/recover/request").send(params));
            const BodyValidatorTester = EndpointValidatorTester("body");
            const FieldValidatorTester = BodyValidatorTester("email");
            FieldValidatorTester.isRequired();
            FieldValidatorTester.mustBeEmail();
        });
    });

    test("should return ok and not send email nor generate a token if account not found", async () => {
        const res = await request()
            .post("/auth/recover/request")
            .send({ email: "not_valid_email@email.com" });

        expect(EmailService.sendMail).not.toHaveBeenCalled();
        expect(token.generateToken).not.toHaveBeenCalled();

        expect(res.status).toBe(StatusCodes.OK);
    });

    test("should generate token and send email if account found", async () => {
        await request()
            .post("/auth/recover/request")
            .send({ email: test_account.email })
            .expect(StatusCodes.OK);

        expect(token.generateToken).toHaveBeenCalledWith({ email: test_account.email }, env.jwt_secret, RECOVERY_LINK_EXPIRATION);

        const generatedToken = generateTokenSpy.mock.results[0].value;

        const emailOptions = REQUEST_ACCOUNT_RECOVERY(`${env.password_recovery_link}/${generatedToken}`);
        expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
            subject: emailOptions.subject,
            to: test_account.email,
            template: emailOptions.template,
            context: emailOptions.context,
        }));
    });
});
