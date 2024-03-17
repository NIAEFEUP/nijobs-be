import CompanyApplication from "../src/models/CompanyApplication";
import SchemaTester from "./utils/SchemaTester";
import ApplicationStatus from "../src/models/constants/ApplicationStatus";
import CompanyApplicationConstants from "../src/models/constants/CompanyApplication";

const companyApplicationTester = SchemaTester(CompanyApplication);
describe("# CompanyApplication schema tests", () => {
    describe("Testing required fields", () => {
        companyApplicationTester.fieldRequired("email");
        companyApplicationTester.fieldRequired("password");
        companyApplicationTester.fieldRequired("motivation");
        companyApplicationTester.fieldRequired("companyName");
        companyApplicationTester.fieldRequired("submittedAt");
        companyApplicationTester.fieldRequired("rejectReason", {
            rejectedAt: new Date("01/01/2020"),
        });
    });

    describe("Custom property validator tests", () => {
        companyApplicationTester.dateAfterDate("approvedAt", "submittedAt");
        companyApplicationTester.dateAfterDate("rejectedAt", "submittedAt");
        companyApplicationTester.mutuallyExclusive("approvedAt", "rejectedAt", {
            submittedAt: new Date("01/01/2020"),
            rejectedAt: new Date("02/01/2020"),
            approvedAt: new Date("02/01/2020"),
        });
        companyApplicationTester.minLength("motivation", CompanyApplicationConstants.motivation.min_length);
        companyApplicationTester.maxLength("motivation", CompanyApplicationConstants.motivation.max_length);
        companyApplicationTester.minLength("rejectReason", CompanyApplicationConstants.rejectReason.min_length);
        companyApplicationTester.maxLength("rejectReason", CompanyApplicationConstants.rejectReason.max_length);
    });

    describe("Application Status tests", () => {
        const rejectReason = "Rejected for a good reason";
        const submittedAt = new Date("01/01/2020");
        const baseApplication = {
            submittedAt: submittedAt,
            companyName: "Testing company",
            password: "password123",
            motivation: "This company has a very valid motivation because otherwise, the tests would not exist.",
        };
        beforeAll(async () => {
            await CompanyApplication.deleteMany({});
        });
        afterAll(async () => {
            await CompanyApplication.deleteMany({});
        });

        describe("Approve and reject functions", () => {
            test("should return PENDING", async () => {
                const application = await CompanyApplication.create({
                    ...baseApplication,
                    email: "pendingApplication@test.com"
                });

                expect(application.state).toBe(ApplicationStatus.PENDING);

                expect(application.rejectedAt).toBeUndefined();
                expect(application.approvedAt).toBeUndefined();
                expect(application.rejectReason).toBeUndefined();
            });

            test("should return REJECTED", async () => {
                const application = await CompanyApplication.create({
                    ...baseApplication,
                    email: "rejectApplication@test.com"
                });
                await application.reject(rejectReason);

                expect(application.state).toBe(ApplicationStatus.REJECTED);
                expect(application.rejectReason).toBe(rejectReason);
                expect(application.rejectedAt).toBeDefined();

                expect(application.approvedAt).toBeUndefined();
            });

            test("should return APPROVED", async () => {
                const application = await CompanyApplication.create({
                    ...baseApplication,
                    email: "approveApplication@test.com"
                });
                await application.approve();

                expect(application.state).toBe(ApplicationStatus.APPROVED);
                expect(application.approvedAt).toBeDefined();

                expect(application.rejectedAt).toBeUndefined();
                expect(application.rejectReason).toBeUndefined();
            });

            test("should return PENDING after undoApproval", async () => {
                const application = await CompanyApplication.create({
                    ...baseApplication,
                    email: "undoApprovalApplication@test.com"
                });

                await application.approve();
                expect(application.state).toBe(ApplicationStatus.APPROVED);

                await application.undoApproval();
                expect(application.state).toBe(ApplicationStatus.PENDING);

                expect(application.rejectedAt).toBeUndefined();
                expect(application.approvedAt).toBeUndefined();
                expect(application.rejectReason).toBeUndefined();
            });

            test("should throw error when trying to approve a rejected application", async () => {
                const application = await CompanyApplication.create({
                    ...baseApplication,
                    email: "invalidApprove@test.com",
                });

                await application.reject(rejectReason);
                expect(() => application.approve()).toThrow();
            });

            test("should throw error when trying to reject an approved application", async () => {
                const application = await CompanyApplication.create({
                    ...baseApplication,
                    email: "invalidReject@test.com",
                });

                await application.approve();
                expect(() => application.reject(rejectReason)).toThrow();
            });
        });

        describe("Migration of application state with correct default value", () => {
            const assessedAt = new Date(submittedAt.getTime() + 1);
            test("should return APPROVED if approvedAt is defined", async () => {
                const application = await CompanyApplication.create({
                    ...baseApplication,
                    email: "approvedAtStatus@test.com",
                    approvedAt: assessedAt,
                });
                expect(application.state).toBe(ApplicationStatus.APPROVED);
            });

            test("should return REJECTED if rejectedAt is defined", async () => {
                const application = await CompanyApplication.create({
                    ...baseApplication,
                    email: "rejectedAtStatus@test.com",
                    rejectedAt: assessedAt,
                    rejectReason: rejectReason,
                });
                expect(application.state).toBe(ApplicationStatus.REJECTED);
            });
        });
    });
});
