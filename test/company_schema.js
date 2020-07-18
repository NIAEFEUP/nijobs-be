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

        describe("required using custom validators (checking for array lengths, etc)", () => {
            describe("There must be at least one contact", () => {
                test("No contacts throws error", () => {
                    const test_contacts = new Map();

                    const company = new Company({
                        contacts: test_contacts,
                    });

                    return company.validate((err) => {
                        expect(err.errors.contacts).toBeDefined();
                        expect(err.errors.contacts).toHaveProperty("kind", "user defined");
                        expect(err.errors.contacts).toHaveProperty("message", "There must be at least one contact");
                    });
                });

                test("At least 1 contact does not throw error", () => {
                    const company = new Company({
                        contacts: {
                            email: "legitcontact@company.com",
                        },
                    });

                    return company.validate((err) => {
                        expect(err.errors.contacts).toBeFalsy();
                    });
                });

            });
        });
    });
});
