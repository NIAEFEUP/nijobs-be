const {
    should,
} = require("./common");

const Ad = require("../src/models/Ad");
// const {} = require("../src/models/JobTypes");
const { MIN_FIELDS, MAX_FIELDS } = require("../src/models/FieldTypes");
const { MIN_TECHNOLOGIES, MAX_TECHNOLOGIES } = require("../src/models/TechnologyTypes");

describe("# Ad Schema tests", () => {
    before("Clearing Ads", async () => {
        await Ad.deleteMany({});
    });
    
    describe("Required fields tests", () => {
        describe("required using schema 'required' property (no user defined validators)", () => {
            it("'title' is required", () => {
                const ad = new Ad({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return ad.validate(err => {
                    should.exist(err.errors.title);
                    err.errors.title.should.have.property("kind").equal("required");
                    err.errors.title.should.have.property("message").equal("Path `title` is required.");
                });
            });
            
            it("'publishDate' is required", () => {
                const ad = new Ad({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return ad.validate(err => {
                    should.exist(err.errors.publishDate);
                    err.errors.publishDate.should.have.property("kind").equal("required");
                    err.errors.publishDate.should.have.property("message").equal("Path `publishDate` is required.");
                });
            });
            
            it("'endDate' is required", () => {
                const ad = new Ad({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return ad.validate(err => {
                    should.exist(err.errors.endDate);
                    err.errors.endDate.should.have.property("kind").equal("required");
                    err.errors.endDate.should.have.property("message").equal("Path `endDate` is required.");
                });
            });

            it("'description' is required", () => {
                const ad = new Ad({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return ad.validate(err => {
                    should.exist(err.errors.description);
                    err.errors.description.should.have.property("kind").equal("required");
                    err.errors.description.should.have.property("message").equal("Path `description` is required.");
                });
            });

            it("'contacts' is required", () => {
                const ad = new Ad({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return ad.validate(err => {
                    should.exist(err.errors.contacts);
                    err.errors.contacts.should.have.property("kind").equal("required");
                    err.errors.contacts.should.have.property("message").equal("Path `contacts` is required.");
                });
            });

            it("'jobType' is required", () => {
                const ad = new Ad({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return ad.validate(err => {
                    should.exist(err.errors.jobType);
                    err.errors.jobType.should.have.property("kind").equal("required");
                    err.errors.jobType.should.have.property("message").equal("Path `jobType` is required.");
                });
            });

            it("'owner' is required", () => {
                const ad = new Ad({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return ad.validate(err => {
                    should.exist(err.errors.owner);
                    err.errors.owner.should.have.property("kind").equal("required");
                    err.errors.owner.should.have.property("message").equal("Path `owner` is required.");
                });
            });
        });

        describe("required using custom validators (checking for array lengths, etc)", () => {
            it(`'fields' must have between ${MIN_FIELDS} and ${MAX_FIELDS} values`, () => {
                const ad = new Ad({});
                return ad.validate(err => {
                    should.exist(err.errors.fields);
                    err.errors.fields.should.have.property("kind").equal("user defined");
                    err.errors.fields.should.have.property("message").equal(`There must be between ${MIN_FIELDS} and ${MAX_FIELDS} fields`);
                });
            });

            it(`'technologies' must have between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES} values`, () => {
                const ad = new Ad({});
                return ad.validate(err => {
                    should.exist(err.errors.technologies);
                    err.errors.technologies.should.have.property("kind").equal("user defined");
                    err.errors.technologies.should.have.property("message").equal(`There must be between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES} technologies`);
                });
            });
        });
    });

    describe("Values in enum tests", () => {
        // TODO: jobTypes, fields and technologies
        it("TODO");
    });

    describe("Custom validator tests", () => {
        // All custom validators that do not fit in other categories, such as date validation, etc
        it("TODO");
    });
});