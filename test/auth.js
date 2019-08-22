const {
    should,
    request,
    agent,
} = require("./common");

const ERROR_TYPES = require("../src/routes/errors/errorHandler");
const Account = require("../src/models/Account");

describe("# Authentication endpoint tests", () => {
    describe("Register endpoint", () => {

        describe("Validation tests", () => {
            describe("Missing required fields", () => {
                it("Should return a malformed request (missing username)", () => request()
                    .post("/api/auth/register")
                    .send({}).then((res) => {
                        res.should.have.status(400);
                        res.body.should.be.an("object");
                        res.body.should.have.property("success").equal(false);
                        res.body.should.have.property("reason").that.is.a("string");
                        res.body.should.have.property("error_code").equal(ERROR_TYPES.MISSING_FIELD);
                    }));

                it("Should return a malformed request (missing password)", () => request()
                    .post("/api/auth/register")
                    .send({
                        username: "user",
                    }).then((res) => {
                        res.should.have.status(400);
                        res.body.should.be.an("object");
                        res.body.should.have.property("success").equal(false);
                        res.body.should.have.property("reason").that.is.a("string");
                        res.body.should.have.property("error_code").equal(ERROR_TYPES.MISSING_FIELD);
                    }));
            });
        });

        describe("Using valid input", () => {
            before("Clearing accounts", () => Account.deleteMany({}));
            after("Clearing accounts", () => Account.deleteMany({}));
            const user = {
                username: "user",
                password: "password",
            };

            it("Should make a successful registration", async () => {

                const res = await request()
                    .post("/api/auth/register")
                    .send(user);

                res.should.have.status(200);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(true);

                const registered_user = await Account.findOne({ username: user.username });
                should.exist(registered_user);
                registered_user.should.have.property("username").equal(user.username);
            });

            it("Stop registering of users with duplicate usernames", () => request()
                .post("/api/auth/register")
                .send(user).then((res) => {
                    res.should.have.status(500);
                    res.body.should.be.an("object");
                    res.body.should.have.property("reason").that.is.a("string");
                    res.body.should.have.property("success").equal(false);
                    res.body.should.have.property("error_code").equal(ERROR_TYPES.DB_ERROR);
                }));
        });
    });

    describe("Login/Logout enpoints", () => {
        before("Adding user", () => {
            this.agent = agent();

            this.user = {
                username: "user",
                password: "password",
            };

            return Account.create([this.user]);
        });


        it("Should return forbidden when retrieving the information of the logged in user", () => request()
            .get("/api/auth/login")
            .send().then((res) => {
                res.should.have.status(401);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(false);
                res.body.should.have.property("reason").that.is.a("string");
            }));


        it("Log in with registered account", () => this.agent
            .post("/api/auth/login")
            .send(this.user).then((res) => {
                res.should.have.cookie("connect.sid");
                res.should.have.status(200);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(true);
            }));

        it("Get logged in user info", () => this.agent
            .get("/api/auth/login")
            .send().then((res) => {
                res.should.have.status(200);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(true);
                res.body.should.have.nested.property("data.username").equal(this.user.username);
            }));

        it("Log out with registered account", () => this.agent
            .delete("/api/auth/login")
            .send().then((res) => {
                res.should.have.status(200);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(true);
            }));

        it("Verify if the log out happen server side", () => this.agent
            .get("/api/auth/login")
            .send().then((res) => {
                res.should.have.status(401);
                res.body.should.be.an("object");
                res.body.should.have.property("success").equal(false);
                res.body.should.have.property("reason").that.is.a("string");
            }));
    });

});
