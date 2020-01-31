const CompanyApplication = require("../src/models/CompanyApplication");
const SchemaTester = require("./utils/SchemaTester");

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
        companyApplicationTester.minLength("motivation", 10);
        companyApplicationTester.maxLength("motivation", 1500);
        companyApplicationTester.minLength("rejectReason", 10);
        companyApplicationTester.maxLength("rejectReason", 1500);
    });

});
