jest.mock("../../src/lib/emailService");
import EmailService, { EmailService as EmailServiceClass } from "../../src/lib/emailService";
jest.spyOn(EmailServiceClass.prototype, "verifyConnection").mockImplementation(() => Promise.resolve());
import { StatusCodes } from "http-status-codes";
import CompanyApplication, { CompanyApplicationRules } from "../../src/models/CompanyApplication";
import Account from "../../src/models/Account";
import { ErrorTypes } from "../../src/api/middleware/errorHandler";
import ApplicationStatus from "../../src/models/constants/ApplicationStatus";
import { APPROVAL_NOTIFICATION, REJECTION_NOTIFICATION } from "../../src/email-templates/companyApplicationApproval";
import mongoose from "mongoose";
import hash from "../../src/lib/passwordHashing";

const { ObjectId } = mongoose.Types;

describe("Company application review endpoint test", () => {

    const test_agent = agent();
    const test_user_admin = {
        email: "admin@email.com",
        password: "password123",
    };

    beforeAll(async () => {
        await Account.deleteMany({});
        await Account.create({ email: test_user_admin.email, password: await hash(test_user_admin.password), isAdmin: true });
    });

    beforeEach(async () => {
        await test_agent
            .post("/auth/login")
            .send(test_user_admin)
            .expect(StatusCodes.OK);
    });

    describe("/applications/company", () => {

        describe("Approval/Rejection", () => {
            let application;
            const pendingApplication = {
                email: "test2@test.com",
                password: "password123",
                companyName: "Testing company",
                motivation: "This company has a very valid motivation, because otherwise the tests would not exist.",
                submittedAt: new Date("2019-11-25"),
            };


            describe("Approve application", () => {

                beforeEach(async () => {
                    await Account.deleteMany({ email: pendingApplication.email });
                    application = await CompanyApplication.create(pendingApplication);
                });

                afterEach(async () => {
                    await CompanyApplication.deleteMany({});
                });

                test("Should approve pending application", async () => {

                    const res = await test_agent
                        .post(`/applications/company/${application._id}/approve`);

                    expect(res.status).toBe(StatusCodes.OK);
                    expect(res.body.email).toBe(pendingApplication.email);
                    expect(res.body.companyName).toBe(pendingApplication.companyName);
                });

                test("Should send approval email to company email", async () => {

                    const res = await test_agent
                        .post(`/applications/company/${application._id}/approve`);

                    expect(res.status).toBe(StatusCodes.OK);

                    const emailOptions = APPROVAL_NOTIFICATION(application.companyName);

                    expect(EmailService.sendMail).toHaveBeenCalledWith({
                        subject: emailOptions.subject,
                        to: application.email,
                        template: emailOptions.template,
                        context: emailOptions.context,
                    });

                });

                test("Should fail if trying to approve inexistent application", async () => {

                    const res = await test_agent
                        .post(`/applications/company/${new ObjectId()}/approve`);

                    expect(res.status).toBe(StatusCodes.NOT_FOUND);
                });

                test("Should fail if trying to approve already approved application", async () => {
                    await test_agent
                        .post(`/applications/company/${application._id}/approve`);

                    const res = await test_agent
                        .post(`/applications/company/${application._id}/approve`);

                    expect(res.status).toBe(StatusCodes.CONFLICT);
                });

                test("Should fail if trying to approve already rejected application", async () => {
                    await test_agent
                        .post(`/applications/company/${application._id}/reject`)
                        .send({ rejectReason: "Some reason which is valid" });


                    const res = await test_agent
                        .post(`/applications/company/${application._id}/approve`);

                    expect(res.status).toBe(StatusCodes.CONFLICT);
                });

                test("Should fail if approving application with an existing account with same email, and then rollback", async () => {
                    await Account.create({ email: application.email, password: "passwordHashedButNotReally", isAdmin: true });

                    const res = await test_agent
                        .post(`/applications/company/${application._id}/approve`);

                    expect(res.status).toBe(StatusCodes.CONFLICT);
                    expect(res.body.error_code).toBe(ErrorTypes.VALIDATION_ERROR);
                    expect(res.body.errors[0].msg).toBe(CompanyApplicationRules.EMAIL_ALREADY_IN_USE.msg);

                    const result_application = await CompanyApplication.findById(application._id);
                    expect(result_application.state).toBe(ApplicationStatus.PENDING);
                });
            });

            describe("Reject application", () => {

                beforeEach(async () => {
                    await Account.deleteMany({ email: pendingApplication.email });
                    application = await CompanyApplication.create(pendingApplication);
                });

                afterEach(async () => {
                    await CompanyApplication.deleteMany({});
                });

                test("Should fail if no rejectReason provided", async () => {
                    const res = await test_agent
                        .post(`/applications/company/${application._id}/reject`);

                    expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
                    expect(res.body.errors[0]).toStrictEqual({ location: "body", msg: "required", param: "rejectReason" });

                });

                test("Should reject pending application", async () => {
                    const res = await test_agent
                        .post(`/applications/company/${application._id}/reject`)
                        .send({ rejectReason: "Some reason which is valid" });

                    expect(res.status).toBe(StatusCodes.OK);
                    expect(res.body.email).toBe(pendingApplication.email);
                    expect(res.body.companyName).toBe(pendingApplication.companyName);
                });

                test("Should send rejection email to company email", async () => {

                    const res = await test_agent
                        .post(`/applications/company/${application._id}/reject`)
                        .send({ rejectReason: "Some reason which is valid" });

                    expect(res.status).toBe(StatusCodes.OK);

                    const emailOptions = REJECTION_NOTIFICATION(application.companyName);

                    expect(EmailService.sendMail).toHaveBeenCalledWith({
                        subject: emailOptions.subject,
                        to: application.email,
                        template: emailOptions.template,
                        context: emailOptions.context,
                    });

                });

                test("Should fail if trying to reject inexistent application", async () => {
                    const res = await test_agent
                        .post(`/applications/company/${new ObjectId()}/reject`)
                        .send({ rejectReason: "Some reason which is valid" });

                    expect(res.status).toBe(StatusCodes.NOT_FOUND);
                });

                test("Should fail if trying to reject already approved application", async () => {
                    await test_agent
                        .post(`/applications/company/${application._id}/approve`);

                    const res = await test_agent
                        .post(`/applications/company/${application._id}/reject`)
                        .send({ rejectReason: "Some reason which is valid" });

                    expect(res.status).toBe(StatusCodes.CONFLICT);
                });

                test("Should fail if trying to reject already rejected application", async () => {
                    await test_agent
                        .post(`/applications/company/${application._id}/reject`)
                        .send({ rejectReason: "Some reason which is valid" });

                    const res = await test_agent
                        .post(`/applications/company/${application._id}/reject`)
                        .send({ rejectReason: "Some reason which is valid" });

                    expect(res.status).toBe(StatusCodes.CONFLICT);
                });
            });
        });
    });
});
