const {
    should,
    request,
} = require("./common");

const ExampleUser = require("../src/models/ExampleUser");

const ERROR_TYPES = require("../src/routes/errors/errorHandler");

describe("# 'Example' endpoint tests (example tests, remove later)", () => {
    
    describe("GET /api/example/:name (example test, remove later)", () => {
        it("should return an hello world response with the given name", () => {
            const test_name = "Felizberta Andreia";

            return request().get(`/api/example/${test_name}`)
                .then(res => {
                    res.should.have.status(200);
                    res.body.should.be.an("object");
                    res.body.should.have.property("hi").equal(test_name);
                    res.body.should.have.property("wow").equal(true);
                });
        });
    });

    describe("POST /api/example (example test, remove later)", () => {
        describe("when there are no previous users", () => {
            beforeEach("Clearing the users", async () => {
                await ExampleUser.deleteMany({});
            });

            it("should return a malformed request error when no username is sent", () => {
                return request().post("/api/example")
                    .send({})
                    .then(res => {
                        res.should.have.status(400);
                        res.body.should.be.an("object");
                        res.body.should.have.property("success").equal(false);
                        res.body.should.have.property("reason").that.is.a("string");
                        res.body.should.have.property("error_code").equal(ERROR_TYPES.MISSING_FIELD);
                    });
            });
    
            it("should return success when the username is sent (user correctly inserted)", () => {
                const test_username = "wowzers";
    
                // Calling endpoint and checking status
                return request().post("/api/example")
                    .send({"username": test_username})
                    .then(async res => {
                        res.should.have.status(200);
                        res.body.should.be.an("object");
                        res.body.should.have.property("success").equal(true);
                    
                        // Verifying new user
                        const new_user = await ExampleUser.findOne({"username": test_username});
                        // Syntax switch to ensure that even if new_user is undefined this does not crash
                        should.exist(new_user);
                        new_user.should.have.property("username").equal(test_username);
                        new_user.should.have.property("age").equal(420); // default age
                    });
            });
    
            it("should return success when the username and age are sent (user correctly inserted)", () => {
                const test_username = "testz";
                const test_age = 101;
    
                // Calling endpoint and checking status
                return request().post("/api/example")
                    .send({
                        "username": test_username,
                        "age": test_age
                    }).then(async res => {
                        res.should.have.status(200);
                        res.body.should.be.an("object");
                        res.body.should.have.property("success").equal(true);
                    
                        // Verifying new user
                        const new_user = await ExampleUser.findOne({"username": test_username});
                        // Syntax switch to ensure that even if new_user is undefined this does not crash
                        should.exist(new_user);
                        new_user.should.have.property("username").equal(test_username);
                        new_user.should.have.property("age").equal(test_age);
                    });
            });
        });

        // Future tests could test duplicate users, for example, among other things (these are just examples)
        // No callback: test is pending
        // it("when there are previous users (todo, example idea)");
    });

    describe("GET /api/example (example test, remove later)", () => {
        before("Clearing the users", async () => {
            await ExampleUser.deleteMany({});
        });

        afterEach("Clearing the users", async () => {
            await ExampleUser.deleteMany({});
        });

        describe("when there are no users", () => {
            it("should return an empty response", () => {
                return request().get("/api/example")
                    .then(async res => {
                        res.should.have.status(200);
                        res.body.should.be.an("object");
                        res.body.should.have.property("success").equal(true);
                        res.body.should.have.property("users").that.is.an("array").that.is.empty;
                    });
            });
        });

        describe("when there are a previous users", () => {
            before("inserting tests users", async () => {
                this.test_user1 = {
                    "username": "thelegend27",
                    "age": 901
                };

                await ExampleUser.create([
                    this.test_user1
                ]);
            });

            it("should list the existing users", () => {
                return request().get("/api/example")
                    .then(res => {
                        res.should.have.status(200);
                        res.body.should.be.an("object");
                        res.body.should.have.property("success").equal(true);
                        res.body.should.have.property("users").that.is.an("array");
                        res.body.users.should.have.lengthOf(1);
                        res.body.users[0].should.have.property("username", this.test_user1.username);
                        res.body.users[0].should.have.property("age", this.test_user1.age);
                    });
            });
        });
    });
});