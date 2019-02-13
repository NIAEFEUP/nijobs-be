const {
    should,
    request,
    // server
} = require("./common");

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

describe("Testing example GET endpoint (example test, remove later)", () => {

    it("should return an hello world response with the given name", () => {
        const test_name = "Felizberta Andreia";

        return request.get(`/api/example/${test_name}`)
            .then(res => {
                res.should.have.status(200);
                res.body.should.be.an("object");
                res.body.should.have.property("hi").equal(test_name);
                res.body.should.have.property("wow").equal(true);
            });
    });
});