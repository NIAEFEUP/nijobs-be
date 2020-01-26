const Account = require("../src/models/Account");

describe("# Account schema tests", () => {
    describe("Testing required fields", () => {
        test("'email' is required", async () => {
            const account = new Account({});

            try {
                await account.validate();
            } catch (err) {
                expect(err.errors.email).toBeDefined();
                expect(err.errors.email).toHaveProperty("kind", "required");
                expect(err.errors.email).toHaveProperty("message", "Path `email` is required.");
            }
        });

        test("'password' is required", async () => {
            const account = new Account({});

            try {
                await account.validate();
            } catch (err) {
                expect(err.errors.password).toBeDefined();
                expect(err.errors.password).toHaveProperty("kind", "required");
                expect(err.errors.password).toHaveProperty("message", "Path `password` is required.");
            }
        });

        describe("'company' required-ness validation", () => {
            test("is required when Account is not admin", async () => {
                const account = new Account({});

                try {
                    await account.validate();
                } catch (err) {
                    expect(err.errors.company).toBeDefined();
                    expect(err.errors.company).toHaveProperty("kind", "required");
                    expect(err.errors.company).toHaveProperty("message", "Path `company` is required.");
                }
            });

            test("is not required when Account is admin", async () => {
                const account = new Account({
                    isAdmin: true,
                });

                try {
                    await account.validate();
                } catch (err) {
                    expect(err.errors.company).not.toBeDefined();
                }
            });
        });
    });
    describe("Company rep and admin are mutually exclusive", () => {
        test("error is thrown when account is both admin and company rep", async () => {
            const account = new Account({
                isAdmin: true,
                company: "11d622e2615d",
            });

            try {
                await account.validate();
            } catch (err) {
                expect(err.errors.company).toBeDefined();
                expect(err.errors.company).toHaveProperty("kind", "user defined");
                expect(err.errors.company).toHaveProperty("message", "A user cannot be a company representative and an admin");
                expect(err.errors.isAdmin).toBeDefined();
                expect(err.errors.isAdmin).toHaveProperty("kind", "user defined");
                expect(err.errors.isAdmin).toHaveProperty("message", "A user cannot be an admin and a company representative");
            }
        });

        describe("error is not thrown", () => {
            test("when account is just admin", async () => {
                const account = new Account({
                    isAdmin: true,
                });

                try {
                    await account.validate();
                } catch (err) {
                    expect(err.errors.company).not.toBeDefined();
                    expect(err.errors.isAdmin).not.toBeDefined();
                }
            });

            test("when account is just company rep", async () => {
                const account = new Account({
                    company: "11d622e2615d",
                });

                try {
                    await account.validate();
                } catch (err) {
                    expect(err.errors.company).not.toBeDefined();
                    expect(err.errors.isAdmin).not.toBeDefined();
                }
            });
        });
    });
});
