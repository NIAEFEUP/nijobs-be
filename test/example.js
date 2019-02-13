const {
    should,
    request,
} = require("./common");

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
        // Calling endpoint and checking status

        // Verifying user inserted in db
    });

    // Future tests could test duplicate users, for example, among other things (these are just examples)
});