import { StatusCodes } from "http-status-codes";
import Account from "../../../src/models/Account";
import Company from "../../../src/models/Company";
import ValidatorTester from "../../utils/ValidatorTester";
import withGodToken from "../../utils/GodToken";
import hash from "../../../src/lib/passwordHashing";

describe("POST /auth/login", () => {
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

    test("should fail to login if password is wrong", async () => {
        await test_agent
            .post("/auth/login")
            .send({
                email: "user@gmail.com",
                password: "password",
            })
            .expect(StatusCodes.UNAUTHORIZED);
    });

    test("should successfully login with registered account", async () => {
        await test_agent
            .post("/auth/login")
            .send(test_user_admin)
            .expect(StatusCodes.OK);
    });
});

describe("DELETE /auth/login", () => {
    const test_agent = agent();

    const test_user_admin = {
        email: "admin@email.com",
        password: "password123",
    };

    beforeAll(async () => {
        await Account.deleteMany({});

        await Account.create({
            email: test_user_admin.email,
            password: await hash(test_user_admin.password),
            isAdmin: true
        });
    });

    afterAll(async () => {
        await Account.deleteMany({});
    });

    test("should return OK since the logout is idempotent", async () => {
        await test_agent
            .delete("/auth/login")
            .send()
            .expect(StatusCodes.OK);
    });

    test("should be successful when logging out the current user", async () => {

        await test_agent
            .post("/auth/login")
            .send(test_user_admin)
            .expect(StatusCodes.OK);

        await test_agent
            .delete("/auth/login")
            .send()
            .expect(StatusCodes.OK);
    });
});
