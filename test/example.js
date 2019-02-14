const {
    should,
    request,
} = require("./common");

const ExampleUser = require("../src/models/ExampleUser");

const ERROR_TYPES = require("../src/routes/errors/errorHandler");

describe("Basic Mocha String Test", () => {
    it("should return number of characters in a string", () => {
        should.equal("Hello".length, 5);
    });

    it("should return first character of the string", () => {
        should.equal("Hello".charAt(0), "H");
    });
});

describe("Basic Mocha Values Test", () => {
    it("should return (3 == 3) true", () => {
        should.equal(3, 3);
    });

    it("should return (3 > 5) false", () => {
        (3 > 5).should.be.false;
    });
    
    it("should have property name with value Figo", () => {
        const car = {name:"Figo", Maker:"Ford"};
        car.should.have.property("name").equal("Figo");
    });
    
    it("Checking for null", () => {
        const car = null;
        //car.should.not.exist; (Cannot read property 'should' of null)
        should.not.exist(car);
    });
});

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

    // Future tests could test duplicate users, for example, among other things (these are just examples)
});