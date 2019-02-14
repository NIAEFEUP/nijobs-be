const {
    should,
} = require("./common");

describe("# Sample boilerplate tests", () => {

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
});