jest.mock("../../../../../src/lib/emailService");
import EmailService, { EmailService as EmailServiceClass } from "../../../../../src/lib/emailService";
jest.spyOn(EmailServiceClass.prototype, "verifyConnection").mockImplementation(() => Promise.resolve());
import { StatusCodes } from "http-status-codes";
import Account from "../../../../../src/models/Account";
import CompanyApplication from "../../../../../src/models/CompanyApplication";
import hash from "../../../../../src/lib/passwordHashing";
import { REJECTION_NOTIFICATION } from "../../../../../src/email-templates/companyApplicationApproval";

import mongoose from "mongoose";

const { ObjectId } = mongoose.Types;

describe("POST /applications/company/:id/reject", () => {

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

    test("Should fail if trying to reject inexistent application", async () => {

        const id = new ObjectId();

        await test_agent
            .post(`/applications/company/${id}/reject`)
            .send({ rejectReason: "Some reason which is valid" })
            .expect(StatusCodes.NOT_FOUND);
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

        let pendingApplication1, pendingApplication2;

        beforeAll(async () => {
            await CompanyApplication.deleteMany({});

            [
                pendingApplication1,
                pendingApplication2,
            ] = await CompanyApplication.create([
                pendingApplication1Data,
                pendingApplication2Data,
            ]);
        });

        afterAll(async () => {
            await CompanyApplication.deleteMany({});
        });

        test("Should fail if no rejectReason provided", async () => {
            const res = await test_agent
                .post(`/applications/company/${pendingApplication1._id}/reject`);

            expect(res.status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
            expect(res.body.errors[0]).toStrictEqual({ location: "body", msg: "required", param: "rejectReason" });
        });

        test("Should reject pending application", async () => {

            const res = await test_agent
                .post(`/applications/company/${pendingApplication1._id}/reject`)
                .send({ rejectReason: "Some reason which is valid" })
                .expect(StatusCodes.OK);

            expect(res.body).toHaveProperty("email", pendingApplication1Data.email);
            expect(res.body).toHaveProperty("companyName", pendingApplication1Data.companyName);
        });

        test("Should send rejection email to company email", async () => {

            await test_agent
                .post(`/applications/company/${pendingApplication2._id}/reject`)
                .send({ rejectReason: "Some reason which is valid" })
                .expect(StatusCodes.OK);

            const emailOptions = REJECTION_NOTIFICATION(pendingApplication2.companyName);

            expect(EmailService.sendMail).toHaveBeenCalledWith({
                subject: emailOptions.subject,
                to: pendingApplication2.email,
                template: emailOptions.template,
                context: emailOptions.context,
            });
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

        test("Should fail if trying to reject already approved application", async () => {
            await test_agent
                .post(`/applications/company/${approvedApplication._id}/reject`)
                .send({ rejectReason: "Some reason which is valid" })
                .expect(StatusCodes.CONFLICT);
        });

        test("Should fail if trying to reject already rejected application", async () => {
            await test_agent
                .post(`/applications/company/${rejectedApplication._id}/reject`)
                .send({ rejectReason: "Some reason which is valid" })
                .expect(StatusCodes.CONFLICT);
        });
    });
});