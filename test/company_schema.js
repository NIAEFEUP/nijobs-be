const Company = require("../src/models/Company");

describe("# Company Schema tests", () => {
    describe("Required and bound (min and max) properties tests", () => {
        describe("required using schema 'required' property (no user defined validators)", () => {
            test("'name' is required", () => {
                const company = new Company({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return company.validate((err) => {
                    expect(err.errors.name).toBeDefined();
                    expect(err.errors.name).toHaveProperty("kind", "required");
                    expect(err.errors.name).toHaveProperty("message", "Path `name` is required.");
                });
            });

            test("'contacts' is required", () => {
                const company = new Company({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return company.validate((err) => {
                    expect(err.errors.contacts).toBeDefined();
                    expect(err.errors.contacts).toHaveProperty("kind", "required");
                    expect(err.errors.contacts).toHaveProperty("message", "Path `contacts` is required.");
                });
            });

            test("'bio' is required", () => {
                const company = new Company({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return company.validate((err) => {
                    expect(err.errors.bio).toBeDefined();
                    expect(err.errors.bio).toHaveProperty("kind", "required");
                    expect(err.errors.bio).toHaveProperty("message", "Path `bio` is required.");
                });
            });
        });

        describe("Required to respect a certain length", () => {
            describe("'bio' has a maxLength of 1500", () => {
                test("Larger than the limit throws error", () => {
                    const test_bio = "c".repeat(2000);
                    const company = new Company({
                        bio: test_bio,
                    });

                    return company.validate((err) => {
                        expect(err.errors.bio).toBeDefined();
                        expect(err.errors.bio).toHaveProperty("kind", "maxlength");
                        expect(err.errors.bio).toHaveProperty("message",
                            `Path \`bio\` (\`${test_bio}\`) is longer than the maximum allowed length (1500).`
                        );
                    });
                });

                test("Smaller than the limit does not throw error", () => {
                    const company = new Company({
                        bio: "We are a company!",
                    });

                    return company.validate((err) => {
                        expect(err.errors.bio).toBeFalsy();
                    });
                });
            });
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
