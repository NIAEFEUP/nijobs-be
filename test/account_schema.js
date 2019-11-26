const Account = require("../src/models/Account");

describe("# Account schema tests", () => {
    describe("Testing required fields", () => {
        test("'username' is required", () => {
            const account = new Account({});

            return account.validate((err) => {
                expect(err.errors.username).toBeDefined();
                expect(err.errors.username).toHaveProperty("kind", "required");
                expect(err.errors.username).toHaveProperty("message", "Path `username` is required.");
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

    describe("Testing maximum and minimum lenghts for fields (checking string lengths)", () => {
        describe("'username' must be between 3 and 20 characters", () => {
            test("Below minimum should throw error", () => {
                const username = "s";
                const account = new Account({
                    username,
                });
                return account.validate((err) => {
                    expect(err.errors.username).toBeDefined();
                    expect(err.errors.username).toHaveProperty("kind", "minlength");
                    expect(err.errors.username)
                        .toHaveProperty("message", `Path \`username\` (\`${username}\`) is shorter than the minimum allowed length (3).`);
                });
            });

            test("Above miximum should throw error", () => {
                const username = "thisisa20pluscharacterusermane";
                const account = new Account({
                    username,
                });
                return account.validate((err) => {
                    expect(err.errors.username).toBeDefined();
                    expect(err.errors.username).toHaveProperty("kind", "maxlength");
                    expect(err.errors.username)
                        .toHaveProperty("message", `Path \`username\` (\`${username}\`) is longer than the maximum allowed length (20).`);
                });
            });

            test("Inside the range should not throw error", () => {
                const username = "username";
                const account = new Account({
                    username,
                });
                return account.validate((err) => {
                    expect(err.errors.username).not.toBeDefined();
                });
            });
        });
    });
});
