import CompanyApplication from "../../src/models/CompanyApplication";
import SchemaTester from "../utils/SchemaTester";
import ApplicationStatus from "../../src/models/constants/ApplicationStatus";
import CompanyApplicationConstants from "../../src/models/constants/CompanyApplication";

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

    describe("Virtual field tests", () => {
        describe("Test `status` virtual field", () => {
            test("should return PENDING", () => {
                const application = new CompanyApplication({
                    submittedAt: new Date("01/01/2020"),
                });

                expect(application.state).toBe(ApplicationStatus.PENDING);
            });

            test("should return REJECTED", () => {
                const application = new CompanyApplication({
                    submittedAt: new Date("01/01/2020"),
                    rejectedAt: new Date("02/01/2020"),
                });
                expect(application.state).toBe(ApplicationStatus.REJECTED);
            });

            test("should return APPROVED", () => {
                const application = new CompanyApplication({
                    submittedAt: new Date("01/01/2020"),
                    approvedAt: new Date("02/01/2020"),
                });
                expect(application.state).toBe(ApplicationStatus.APPROVED);
            });


        });
    });

});
