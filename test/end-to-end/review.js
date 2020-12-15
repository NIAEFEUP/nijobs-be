const EmailService = require("../../src/lib/nodemailer");
const HTTPStatus = require("http-status-codes");
const CompanyApplication = require("../../src/models/CompanyApplication");
const CompanyApplicationRules = require("../../src/models/CompanyApplication").CompanyApplicationRules;
const { APPROVED, PENDING } = require("../../src/models/constants/ApplicationStatus");
const hash = require("../../src/lib/passwordHashing");
const Account = require("../../src/models/Account");
const { ErrorTypes } = require("../../src/api/middleware/errorHandler");
const ApplicationStatus = require("../../src/models/constants/ApplicationStatus");
const { APPROVAL_NOTIFICATION } = require("../../src/services/emails/companyApplicationApproval");
const { ObjectId } = require("mongoose").Types;

describe("Company application review endpoint test", () => {

    describe("/applications/company", () => {

        describe("Without Auth", () => {
            beforeEach(async () => {
                await CompanyApplication.deleteMany({});
            });

            test("Should return HTTP 401 error", async () => {
                const emptyRes = await request()
                    .get("/applications/company/search");

                expect(emptyRes.status).toBe(HTTPStatus.UNAUTHORIZED);
            });

        });

        describe("With Auth", () => {
            const test_agent = agent();
            const test_user = {
                email: "user@email.com",
                password: "password123",
            };

            beforeAll(async () => {
                await Account.deleteMany({});
                await Account.create({ email: test_user.email, password: await hash(test_user.password), isAdmin: true });

                // Login
                await test_agent
                    .post("/auth/login")
                    .send(test_user)
                    .expect(200);
            });

            beforeEach(async () => {
                await CompanyApplication.deleteMany({});
            });

            test("Should list existing applications", async () => {
                const emptyRes = await test_agent
                    .get("/applications/company/search");

                expect(emptyRes.status).toBe(HTTPStatus.OK);
                expect(emptyRes.body.applications).toEqual([]);

                const application = {
                    email: "test2@test.com",
                    password: "password123",
                    companyName: "Testing company",
                    motivation: "This company has a very valid motivation, because otherwise the tests would not exist.",
                };

                await CompanyApplication.create({
                    ...application,
                    submittedAt: Date.now(),
                });

                const nonEmptyRes = await test_agent
                    .get("/applications/company/search");

                expect(nonEmptyRes.status).toBe(HTTPStatus.OK);
                expect(nonEmptyRes.body.applications.length).toBe(1);
                expect(nonEmptyRes.body.applications[0]).toHaveProperty("email", application.email);

            });

            describe("Filter application results", () => {

                const pendingApplication = {
                    email: "test2@test.com",
                    password: "password123",
                    companyName: "Testing company",
                    motivation: "This company has a very valid motivation, because otherwise the tests would not exist.",
                    submittedAt: new Date("2019-11-25"),
                };

                const approvedApplication = {
                    ...pendingApplication,
                    submittedAt: new Date("2019-11-24"),
                    approvedAt: pendingApplication.submittedAt.getTime() + 1,
                    companyName: "approved Testing company",
                    email: `approved${pendingApplication.email}`,
                };
                const rejectedApplication = { ...pendingApplication,
                    submittedAt: new Date("2019-11-23"),
                    rejectedAt: pendingApplication.submittedAt.getTime() + 1,
                    companyName: "rejected Testing company",
                    email: `rejected${pendingApplication.email}`,
                    rejectReason: "2bad4nij0bs",
                };

                beforeEach(async () => {
                    await CompanyApplication.create(pendingApplication);
                    await CompanyApplication.create(approvedApplication);
                    await CompanyApplication.create(rejectedApplication);
                });

                afterEach(async () => {
                    await CompanyApplication.deleteMany({});
                });

                test("Should filter by company name", async () => {
                    const fullNameQuery = await test_agent
                        .get(`/applications/company/search?companyName=${"approved Testing company"}`);

                    expect(fullNameQuery.status).toBe(HTTPStatus.OK);
                    expect(fullNameQuery.body.applications.length).toBe(1);
                    expect(fullNameQuery.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);

                    const partialNameQuery = await test_agent
                        .get(`/applications/company/search?companyName=${"Testing company"}`);

                    expect(partialNameQuery.status).toBe(HTTPStatus.OK);
                    expect(partialNameQuery.body.applications.length).toBe(3);
                    expect(partialNameQuery.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
                    expect(partialNameQuery.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
                    expect(partialNameQuery.body.applications[2]).toHaveProperty("companyName", rejectedApplication.companyName);
                });

                test("Should filter by state", async () => {


                    const wrongFormatQuery = await test_agent
                        .get(`/applications/company/search?state=<["${APPROVED}"]`);

                    expect(wrongFormatQuery.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                    expect(wrongFormatQuery.body.errors[0]).toStrictEqual({
                        location: "query",
                        msg: "must-be-array",
                        param: "state",
                        value: `<["${APPROVED}"]`
                    });


                    const singleStateQuery = await test_agent
                        .get(`/applications/company/search?state=["${APPROVED}"]`);

                    expect(singleStateQuery.status).toBe(HTTPStatus.OK);
                    expect(singleStateQuery.body.applications.length).toBe(1);
                    expect(singleStateQuery.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);

                    const multiStateQuery = await test_agent
                        .get(`/applications/company/search?state=["${APPROVED}", "${PENDING}"]`);

                    expect(multiStateQuery.status).toBe(HTTPStatus.OK);
                    expect(multiStateQuery.body.applications.length).toBe(2);
                    expect(multiStateQuery.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
                    expect(multiStateQuery.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
                });

                test("Should filter by date", async () => {

                    const afterQuery = await test_agent
                        .get(`/applications/company/search?submissionDateFrom=${approvedApplication.submittedAt}`);

                    expect(afterQuery.status).toBe(HTTPStatus.OK);
                    expect(afterQuery.body.applications.length).toBe(2);
                    expect(afterQuery.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
                    expect(afterQuery.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);

                    const untilQuery = await test_agent
                        .get(`/applications/company/search?submissionDateTo=${approvedApplication.submittedAt}`);

                    expect(untilQuery.status).toBe(HTTPStatus.OK);
                    expect(untilQuery.body.applications.length).toBe(2);
                    expect(untilQuery.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);
                    expect(untilQuery.body.applications[1]).toHaveProperty("companyName", rejectedApplication.companyName);

                    const intervalQuery = await test_agent
                        .get("/applications/company/search?" +
                            `submissionDateFrom=${approvedApplication.submittedAt}&` +
                            `submissionDateTo=${approvedApplication.submittedAt}`);


                    expect(intervalQuery.status).toBe(HTTPStatus.OK);
                    expect(intervalQuery.body.applications.length).toBe(1);
                    expect(intervalQuery.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);

                });

            });

            describe("Sort application results", () => {

                const pendingApplication = {
                    email: "test2@test.com",
                    password: "password123",
                    companyName: "testing company",
                    motivation: "This company has a very valid motivation, because otherwise the tests would not exist.",
                    submittedAt: new Date("2019-11-25"),
                };

                const approvedApplication = {
                    ...pendingApplication,
                    submittedAt: new Date("2019-11-24"),
                    approvedAt: pendingApplication.submittedAt.getTime() + 1,
                    companyName: "approved Testing company",
                    email: `approved${pendingApplication.email}`,
                };
                const rejectedApplication = { ...pendingApplication,
                    submittedAt: new Date("2019-11-23"),
                    rejectedAt: pendingApplication.submittedAt.getTime() + 1,
                    companyName: "rejected Testing company",
                    email: `rejected${pendingApplication.email}`,
                    rejectReason: "2bad4nij0bs",
                };

                beforeEach(async () => {
                    await CompanyApplication.create(pendingApplication);
                    await CompanyApplication.create(approvedApplication);
                    await CompanyApplication.create(rejectedApplication);
                });

                afterEach(async () => {
                    await CompanyApplication.deleteMany({});
                });

                test("Should sort by company name ascending", async () => {
                    const query = await test_agent
                        .get("/applications/company/search?sortBy=companyName:asc");

                    expect(query.status).toBe(HTTPStatus.OK);
                    expect(query.body.applications.length).toBe(3);
                    expect(query.body.applications[0]).toHaveProperty("companyName", approvedApplication.companyName);
                    expect(query.body.applications[1]).toHaveProperty("companyName", rejectedApplication.companyName);
                    expect(query.body.applications[2]).toHaveProperty("companyName", pendingApplication.companyName);
                });

                test("Should sort by company name descending", async () => {
                    const query = await test_agent
                        .get("/applications/company/search?sortBy=companyName:desc");


                    expect(query.status).toBe(HTTPStatus.OK);
                    expect(query.body.applications.length).toBe(3);
                    expect(query.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
                    expect(query.body.applications[1]).toHaveProperty("companyName", rejectedApplication.companyName);
                    expect(query.body.applications[2]).toHaveProperty("companyName", approvedApplication.companyName);
                });

                test("Should sort by submissionDate descending", async () => {
                    const defaultQuery = await test_agent
                        .get("/applications/company/search");


                    expect(defaultQuery.status).toBe(HTTPStatus.OK);
                    expect(defaultQuery.body.applications.length).toBe(3);
                    expect(defaultQuery.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
                    expect(defaultQuery.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
                    expect(defaultQuery.body.applications[2]).toHaveProperty("companyName", rejectedApplication.companyName);

                    const query = await test_agent
                        .get("/applications/company/search?sortBy=submittedAt:desc");

                    expect(query.status).toBe(HTTPStatus.OK);
                    expect(query.body.applications.length).toBe(3);
                    expect(query.body.applications[0]).toHaveProperty("companyName", pendingApplication.companyName);
                    expect(query.body.applications[1]).toHaveProperty("companyName", approvedApplication.companyName);
                    expect(query.body.applications[2]).toHaveProperty("companyName", rejectedApplication.companyName);
                });

            });

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

                        expect(res.status).toBe(HTTPStatus.OK);
                        expect(res.body.email).toBe(pendingApplication.email);
                        expect(res.body.companyName).toBe(pendingApplication.companyName);
                    });

                    test("Should send approval email to company email", async () => {

                        const res = await test_agent
                            .post(`/applications/company/${application._id}/approve`);

                        expect(res.status).toBe(HTTPStatus.OK);

                        const emailOptions = APPROVAL_NOTIFICATION(application.companyName);

                        expect(EmailService.sendMail).toHaveBeenCalledWith({
                            subject: emailOptions.subject,
                            text: emailOptions.text,
                            html: emailOptions.html,
                            to: application.email
                        });

                    });

                    test("Should fail if trying to approve inexistent application", async () => {

                        const res = await test_agent
                            .post(`/applications/company/${new ObjectId()}/approve`);

                        expect(res.status).toBe(HTTPStatus.CONFLICT);
                    });

                    test("Should fail if trying to approve already approved application", async () => {
                        await test_agent
                            .post(`/applications/company/${application._id}/approve`);

                        const res = await test_agent
                            .post(`/applications/company/${application._id}/approve`);

                        expect(res.status).toBe(HTTPStatus.CONFLICT);
                    });

                    test("Should fail if trying to approve already rejected application", async () => {
                        await test_agent
                            .post(`/applications/company/${application._id}/reject`)
                            .send({ rejectReason: "Some reason which is valid" });


                        const res = await test_agent
                            .post(`/applications/company/${application._id}/approve`);

                        expect(res.status).toBe(HTTPStatus.CONFLICT);
                    });

                    test("Should fail if approving application with an existing account with same email, and then rollback", async () => {
                        await Account.create({ email: application.email, password: "passwordHashedButNotReally", isAdmin: true });

                        const res = await test_agent
                            .post(`/applications/company/${application._id}/approve`);

                        expect(res.status).toBe(HTTPStatus.CONFLICT);
                        expect(res.body.error_code).toBe(ErrorTypes.VALIDATION_ERROR);
                        expect(res.body.errors[0]).toBe(CompanyApplicationRules.EMAIL_ALREADY_IN_USE.msg);

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

                        expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
                        expect(res.body.errors[0]).toStrictEqual({ location: "body", msg: "required", param: "rejectReason" });

                    });

                    test("Should reject pending application", async () => {
                        const res = await test_agent
                            .post(`/applications/company/${application._id}/reject`)
                            .send({ rejectReason: "Some reason which is valid" });

                        expect(res.status).toBe(HTTPStatus.OK);
                        expect(res.body.email).toBe(pendingApplication.email);
                        expect(res.body.companyName).toBe(pendingApplication.companyName);
                    });

                    test("Should fail if trying to reject inexistent application", async () => {
                        const res = await test_agent
                            .post(`/applications/company/${new ObjectId()}/reject`)
                            .send({ rejectReason: "Some reason which is valid" });

                        expect(res.status).toBe(HTTPStatus.CONFLICT);
                    });

                    test("Should fail if trying to reject already approved application", async () => {
                        await test_agent
                            .post(`/applications/company/${application._id}/approve`);

                        const res = await test_agent
                            .post(`/applications/company/${application._id}/reject`)
                            .send({ rejectReason: "Some reason which is valid" });

                        expect(res.status).toBe(HTTPStatus.CONFLICT);
                    });

                    test("Should fail if trying to reject already rejected application", async () => {
                        await test_agent
                            .post(`/applications/company/${application._id}/reject`)
                            .send({ rejectReason: "Some reason which is valid" });

                        const res = await test_agent
                            .post(`/applications/company/${application._id}/reject`)
                            .send({ rejectReason: "Some reason which is valid" });

                        expect(res.status).toBe(HTTPStatus.CONFLICT);
                    });
                });
            });
        });
    });
});
