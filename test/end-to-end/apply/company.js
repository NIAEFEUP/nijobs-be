import EmailService from "../../../src/lib/emailService";
import { StatusCodes } from "http-status-codes";
import CompanyApplication, { CompanyApplicationRules } from "../../../src/models/CompanyApplication";
import Account from "../../../src/models/Account";
import ValidatorTester from "../../utils/ValidatorTester";
import ValidationReasons from "../../../src/api/middleware/validators/validationReasons";
import CompanyApplicationConstants from "../../../src/models/constants/CompanyApplication";
import AccountConstants from "../../../src/models/constants/Account";
import CompanyConstants from "../../../src/models/constants/Company";
import { NEW_COMPANY_APPLICATION_ADMINS, NEW_COMPANY_APPLICATION_COMPANY } from "../../../src/email-templates/companyApplicationApproval";
import config from "../../../src/config/env";

describe("POST /apply/company", () => {
    describe("Input Validation", () => {
        const EndpointValidatorTester = ValidatorTester((params) => request().post("/apply/company").send(params));
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

        describe("motivation", () => {
            const FieldValidatorTester = BodyValidatorTester("motivation");
            FieldValidatorTester.isRequired();
            FieldValidatorTester.mustBeString();
            FieldValidatorTester.hasMinLength(CompanyApplicationConstants.motivation.min_length);
            FieldValidatorTester.hasMaxLength(CompanyApplicationConstants.motivation.max_length);
        });

        describe("companyName", () => {
            const FieldValidatorTester = BodyValidatorTester("companyName");
            FieldValidatorTester.isRequired();
            FieldValidatorTester.mustBeString();
            FieldValidatorTester.hasMinLength(CompanyConstants.companyName.min_length);
            FieldValidatorTester.hasMaxLength(CompanyConstants.companyName.max_length);
        });
    });

    describe("Without any existing application and accounts", () => {

        const RealDateNow = Date.now;
        const mockCurrentDate = new Date("2019-11-23");

        beforeAll(async () => {
            await CompanyApplication.deleteMany({});
            await Account.deleteMany({});

            Date.now = () => mockCurrentDate.getTime();
        });

        afterAll(async () => {
            await CompanyApplication.deleteMany({});
            await Account.deleteMany({});

            Date.now = RealDateNow;
        });

        test("Valid creation", async () => {
            const application = {
                email: "test@test.com",
                password: "password123",
                companyName: "Testing company",
                motivation: "This company has a very valid motivation because otherwise, the tests would not exist.",
            };
            const res = await request()
                .post("/apply/company")
                .send(application)
                .expect(StatusCodes.OK);

            // eslint-disable-next-line no-unused-vars
            const { password, ...rest } = application;
            expect(res.body).toMatchObject(rest);
        });

        test("Should send an email to admin and to company user", async () => {
            const application = {
                email: "test2@test.com",
                password: "password123",
                companyName: "Testing company",
                motivation: "This company has a very valid motivation because otherwise, the tests would not exist.",
            };
            const res = await request()
                .post("/apply/company")
                .send(application)
                .expect(StatusCodes.OK);

            const adminEmailOptions = NEW_COMPANY_APPLICATION_ADMINS(
                application.email, application.companyName, application.motivation);
            const companyEmailOptions = NEW_COMPANY_APPLICATION_COMPANY(
                application.companyName, res.body._id);

            expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: adminEmailOptions.subject,
                to: config.mail_from,
                template: adminEmailOptions.template,
                context: adminEmailOptions.context,
            }));

            expect(EmailService.sendMail).toHaveBeenCalledWith(expect.objectContaining({
                subject: companyEmailOptions.subject,
                to: application.email,
                template: companyEmailOptions.template,
                context: { ...companyEmailOptions.context },
            }));
        });

        describe("Invalid input", () => {

            const application = {
                email: "test2@test.com",
                password: "password123",
                companyName: "Testing company",
                motivation: "This company has a very valid motivation, because otherwise the tests would not exist.",
            };

            beforeAll(async () => {
                await Account.deleteMany({});
                await CompanyApplication.deleteMany({});
            });

            afterAll(async () => {
                await Account.deleteMany({});
                await CompanyApplication.deleteMany({});
            });

            test("Should fail while using an email with an associated Account", async () => {

                await Account.create({
                    email: application.email,
                    password: application.password,
                    isAdmin: true,
                });

                const res = await request()
                    .post("/apply/company")
                    .send(application)
                    .expect(StatusCodes.UNPROCESSABLE_ENTITY);

                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": ValidationReasons.ALREADY_EXISTS("email"),
                    "param": "email",
                    "value": application.email,
                });
            });

            test("Should fail while using an email with an associated application that was not rejected", async () => {

                // Guarantees that the company application will succeed regarding account rules
                await Account.deleteOne({ email: application.email });

                // Existing Application - Default `Pending` state
                await CompanyApplication.create({
                    ...application,
                    submittedAt: Date.now(),
                });

                const res = await request()
                    .post("/apply/company")
                    .send(application)
                    .expect(StatusCodes.UNPROCESSABLE_ENTITY);

                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": CompanyApplicationRules.ONLY_ONE_APPLICATION_ACTIVE_PER_EMAIL.msg,
                    "param": "email",
                    "value": application.email,
                });
            });
        });
    });
});
