import AccountService from "../../../../../src/services/account.js";
jest.mock("../../../../../src/lib/emailService");
import { StatusCodes } from "http-status-codes";
import { APPROVAL_NOTIFICATION } from "../../../../../src/email-templates/companyApplicationApproval";
import EmailService, { EmailService as EmailServiceClass } from "../../../../../src/lib/emailService";
import hash from "../../../../../src/lib/passwordHashing";
import Account from "../../../../../src/models/Account";
import CompanyApplication, { CompanyApplicationRules } from "../../../../../src/models/CompanyApplication";
import ApplicationStatus from "../../../../../src/models/constants/ApplicationStatus";
jest.spyOn(EmailServiceClass.prototype, "verifyConnection").mockImplementation(() => Promise.resolve());

import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

describe("POST /applications/company/:id/approve", () => {

    const test_agent = agent();

    const test_user_admin = {
        email: "admin@email.com",
        password: "password123",
    };

    beforeAll(async () => {
        await CompanyApplication.deleteMany({});

        await Account.deleteMany({});
        await Account.create({
            email: test_user_admin.email,
            password: await hash(test_user_admin.password),
            isAdmin: true
        });
    });

    afterAll(async () => {
        await Account.deleteMany({});
        await CompanyApplication.deleteMany({});
    });

    beforeEach(async () => {
        // default login
        await test_agent
            .post("/auth/login")
            .send(test_user_admin)
            .expect(StatusCodes.OK);
    });

    describe("ID Validation", () => {
        test("Should fail if trying to approve inexistent application", async () => {

            const id = new ObjectId();

            await test_agent
                .post(`/applications/company/${id}/approve`)
                .expect(StatusCodes.NOT_FOUND);

        });
    });

    describe("Without previous applications", () => {

        const pendingApplication1Data = {
            email: "pending1@test.com",
            password: "password123",
            companyName: "Testing company",
            motivation: "This company has a very valid motivation, because otherwise the tests would not exist.",
            submittedAt: new Date("2019-11-25"),
        };
        const pendingApplication2Data = {
            email: "pending2@test.com",
            password: "password123",
            companyName: "Testing company",
            motivation: "This company has a very valid motivation, because otherwise the tests would not exist.",
            submittedAt: new Date("2019-11-25"),
        };
        const unverifiedApplicationData = {
            email: "unverified@test.com",
            password: "password123",
            companyName: "Testing company",
            motivation: "This company has a very valid motivation, because otherwise the tests would not exist.",
            submittedAt: new Date("2019-11-25"),
            isVerified: false
        };

        let pendingApplication1, pendingApplication2, unverifiedApplication;

        beforeAll(async () => {
            await CompanyApplication.deleteMany({});

            [
                pendingApplication1,
                pendingApplication2,
                unverifiedApplication

            ] = await CompanyApplication.create([
                pendingApplication1Data,
                pendingApplication2Data,
                unverifiedApplicationData
            ]);

            await (new AccountService()).registerCompany(
                pendingApplication1Data.email,
                pendingApplication1Data.password,
                pendingApplication1Data.companyName
            );

            await (new AccountService()).registerCompany(
                pendingApplication2Data.email,
                pendingApplication2Data.password,
                pendingApplication2Data.companyName
            );
        });

        afterAll(async () => {
            await CompanyApplication.deleteMany({});
        });

        test("Should approve pending application", async () => {

            const res = await test_agent
                .post(`/applications/company/${pendingApplication1._id}/approve`)
                .expect(StatusCodes.OK);

            expect(res.body).toHaveProperty("email", pendingApplication1Data.email);
            const approved_application = await CompanyApplication.findById(pendingApplication1._id);
            expect(approved_application.state).toBe(ApplicationStatus.APPROVED);
        });

        test("Should send approval email to company email", async () => {

            await test_agent
                .post(`/applications/company/${pendingApplication2._id}/approve`)
                .expect(StatusCodes.OK);

            const emailOptions = APPROVAL_NOTIFICATION(pendingApplication2.companyName);

            expect(EmailService.sendMail).toHaveBeenCalledWith({
                subject: emailOptions.subject,
                to: pendingApplication2.email,
                template: emailOptions.template,
                context: emailOptions.context,
            });
        });

        test("Should fail to approve unverified application", async () => {

            const res = await test_agent
                .post(`/applications/company/${unverifiedApplication._id}/approve`)
                .expect(StatusCodes.CONFLICT);

            expect(res.body.errors).toContainEqual(CompanyApplicationRules.MUST_BE_VERIFIED);
            const approved_application = await CompanyApplication.findById(unverifiedApplication._id);
            expect(approved_application.state).toBe(ApplicationStatus.UNVERIFIED);
        });
    });

    describe("With previous applications", () => {

        const approvedApplicationData = {
            email: "approved@test.com",
            password: "password123",
            companyName: "Testing company",
            motivation: "This company has a very valid motivation, because otherwise the tests would not exist.",
            submittedAt: new Date("2019-11-25"),
            approvedAt: new Date("2019-11-26"),
            rejectReason: null
        };
        const rejectedApplicationData = {
            email: "rejected@test.com",
            password: "password123",
            companyName: "Testing company",
            motivation: "This company has a very valid motivation, because otherwise the tests would not exist.",
            submittedAt: new Date("2019-11-25"),
            rejectedAt: new Date("2019-11-26"),
            rejectReason: "test-reason"
        };

        let approvedApplication, rejectedApplication;

        beforeAll(async () => {
            await CompanyApplication.deleteMany({});

            [
                approvedApplication,
                rejectedApplication,
            ] = await CompanyApplication.create([
                approvedApplicationData,
                rejectedApplicationData,
            ]);
        });

        afterAll(async () => {
            await CompanyApplication.deleteMany({});
        });

        test("Should fail if trying to approve already approved application", async () => {
            await test_agent
                .post(`/applications/company/${approvedApplication._id}/approve`)
                .expect(StatusCodes.CONFLICT);
        });

        test("Should fail if trying to approve already rejected application", async () => {
            await test_agent
                .post(`/applications/company/${rejectedApplication._id}/approve`)
                .expect(StatusCodes.CONFLICT);
        });
    });
});
