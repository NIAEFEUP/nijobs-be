// Copied from api sigarra

const should = require("chai").should();

describe("Basic Mocha String Test", function () {
    it("should return number of characters in a string", function () {
        should.equal("Hello".length, 5);
    });
    it("should return first character of the string", function () {
        should.equal("Hello".charAt(0), "H");
    });
});

describe("Basic Mocha Values Test", function () {
    it("should return (3 == 3) true", function () {
        should.equal(3, 3);
    });
    it("should return (3 > 5) false", function () {
        (3 > 5).should.be.false;
    });
    
    it("should have property name with value Figo", function(){
        const car = {name:"Figo", Maker:"Ford"};
        car.should.have.property("name").equal("Figo");
    });
    
    it("Checking for null", function(){
        const car = null;
        //car.should.not.exist; (Cannot read property 'should' of null)
        should.not.exist(car);
    });
});
