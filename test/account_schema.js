const {
    should,
} = require("./common");

const Account = require("../src/models/Account");

describe("# Account schema tests", () => {
    describe("Testing required fields", () => {
        it("'username' is required", () => {
            const account = new Account({});

            return account.validate((err) => {
                should.exist(err.errors.username);
                err.errors.username.should.have.property("kind").equal("required");
                err.errors.username.should.have.property("message").equal("Path `username` is required.");
            });
        });

        it("'password' is required", () => {
            const account = new Account({});

            return account.validate((err) => {
                should.exist(err.errors.password);
                err.errors.password.should.have.property("kind").equal("required");
                err.errors.password.should.have.property("message").equal("Path `password` is required.");
            });
        });
    });

    describe("Testing maximum and minimum lenghts for fields (checking string lengths)", () => {
        describe("'username' must be between 3 and 20 characters", () => {
            it("Below minimum should throw error", () => {
                const username = "s";
                const account = new Account({
                    username,
                });
                return account.validate((err) => {
                    should.exist(err.errors.username);
                    err.errors.username.should.have.property("kind").equal("minlength");
                    err.errors.username.should.have.property("message")
                        .equal(`Path \`username\` (\`${username}\`) is shorter than the minimum allowed length (3).`);
                });
            });

            it("Above miximum should throw error", () => {
                const username = "thisisa20pluscharacterusermane";
                const account = new Account({
                    username,
                });
                return account.validate((err) => {
                    should.exist(err.errors.username);
                    err.errors.username.should.have.property("kind").equal("maxlength");
                    err.errors.username.should.have.property("message")
                        .equal(`Path \`username\` (\`${username}\`) is longer than the maximum allowed length (20).`);
                });
            });

            it("Inside the range should not throw error", () => {
                const username = "username";
                const account = new Account({
                    username,
                });
                return account.validate((err) => {
                    should.not.exist(err.errors.username);
                });
            });
        });
    });
});
