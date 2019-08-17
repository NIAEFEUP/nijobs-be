const {
    should,
} = require("./common");

const Company = require("../src/models/Company");

describe("# Company Schema tests", () => {    
    describe("Required and bound (min and max) properties tests", () => {
        describe("required using schema 'required' property (no user defined validators)", () => {
            it("'name' is required", () => {
                const company = new Company({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return company.validate(err => {
                    should.exist(err.errors.name);
                    err.errors.name.should.have.property("kind").equal("required");
                    err.errors.name.should.have.property("message").equal("Path `name` is required.");
                });
            });
            
            it("'contacts' is required", () => {
                const company = new Company({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return company.validate(err => {
                    should.exist(err.errors.contacts);
                    err.errors.contacts.should.have.property("kind").equal("required");
                    err.errors.contacts.should.have.property("message").equal("Path `contacts` is required.");
                });
            });
            
            it("'bio' is required", () => {
                const company = new Company({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return company.validate(err => {
                    should.exist(err.errors.bio);
                    err.errors.bio.should.have.property("kind").equal("required");
                    err.errors.bio.should.have.property("message").equal("Path `bio` is required.");
                });
            });
        });

        describe("Required to respect a certain length", () => {
            describe("'bio' has a maxLength of 1500", () => {
                it("Larger than the limit throws error", () => {
                    const test_bio = "c".repeat(2000);
                    const company = new Company({
                        bio: test_bio,
                    });

                    return company.validate(err => {
                        should.exist(err.errors.bio);
                        err.errors.bio.should.have.property("kind").equal("maxlength");
                        err.errors.bio.should.have.property("message").equal(`Path \`bio\` (\`${test_bio}\`) is longer than the maximum allowed length (1500).`);
                    });
                });

                it("Smaller than the limit does not throw error", () => {
                    const company = new Company({
                        bio: "We are a company!",
                    });

                    return company.validate(err => {
                        should.not.exist(err.errors.bio);
                    });
                });
            });
        });

        describe("required using custom validators (checking for array lengths, etc)", () => {
            describe("There must be at least one contact", () => {
                it("No contacts throws error", () => {
                    const test_contacts = new Map();

                    const company = new Company({
                        contacts: test_contacts,
                    });
    
                    return company.validate(err => {
                        should.exist(err.errors.contacts);
                        err.errors.contacts.should.have.property("kind").equal("user defined");
                        err.errors.contacts.should.have.property("message").equal("There must be at least one contact");
                    });
                });

                it("At least 1 contact does not throw error", () => {
                    const company = new Company({
                        contacts: {
                            email: "legitcontact@company.com"
                        },
                    });

                    return company.validate(err => {
                        should.not.exist(err.errors.contacts);
                    });
                });
                
            });
        });
    });
});