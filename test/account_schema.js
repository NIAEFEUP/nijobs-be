const Account = require("../src/models/Account");

describe("# Account schema tests", () => {
    describe("Testing required fields", () => {
        test("'email' is required", () => {
            const account = new Account({});

            return account.validate((err) => {
                expect(err.errors.email).toBeDefined();
                expect(err.errors.email).toHaveProperty("kind", "required");
                expect(err.errors.email).toHaveProperty("message", "Email address is required");
            });
        });

        test("'password' is required", () => {
            const account = new Account({});

            return account.validate((err) => {
                expect(err.errors.password).toBeDefined();
                expect(err.errors.password).toHaveProperty("kind", "required");
                expect(err.errors.password).toHaveProperty("message", "Path `password` is required.");
            });
        });
    });
});
