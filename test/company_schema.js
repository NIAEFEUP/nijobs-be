const Company = require("../src/models/Company");
const SchemaTester = require("./utils/SchemaTester");
const CompanyConstants = require("../src/models/constants/Company");

const CompanySchemaTester = SchemaTester(Company);

describe("# Company Schema tests", () => {
    describe("Required and bound (min and max) properties tests", () => {
        describe("required using schema 'required' property (no user defined validators)", () => {
            CompanySchemaTester.fieldRequired("name");
        });

        describe("Required to respect a certain length", () => {
            CompanySchemaTester.maxLength("bio", CompanyConstants.bio.max_length);
            CompanySchemaTester.minLength("name", CompanyConstants.companyName.min_length);
            CompanySchemaTester.maxLength("name", CompanyConstants.companyName.max_length);
        });
    });
});
