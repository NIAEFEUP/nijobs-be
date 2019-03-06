const {
    should,
} = require("./common");

const Ad = require("../src/models/Ad");
const JobTypes = require("../src/models/JobTypes");
const { MIN_FIELDS, MAX_FIELDS, FieldTypes } = require("../src/models/FieldTypes");
const { MIN_TECHNOLOGIES, MAX_TECHNOLOGIES, TechnologyTypes } = require("../src/models/TechnologyTypes");
const { AD_MAX_LIFETIME_MONTHS } = require("../src/models/TimeConstants");

describe("# Ad Schema tests", () => {
    before("Clearing Ads", async () => {
        await Ad.deleteMany({});
    });
    
    describe("Required and bound (between min and max elements) properties tests", () => {
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

            it("'location' is required", () => {
                const ad = new Ad({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return ad.validate(err => {
                    should.exist(err.errors.location);
                    err.errors.location.should.have.property("kind").equal("required");
                    err.errors.location.should.have.property("message").equal("Path `location` is required.");
                });
            });
        });

        describe("required using custom validators (checking for array lengths, etc)", () => {
            describe(`'fields' must have between ${MIN_FIELDS} and ${MAX_FIELDS} values`, () => {
                it("Below minimum should throw error", () => {
                    const ad = new Ad({});
                    return ad.validate(err => {
                        should.exist(err.errors.fields);
                        err.errors.fields.should.have.property("kind").equal("user defined");
                        err.errors.fields.should.have.property("message").equal(`There must be between ${MIN_FIELDS} and ${MAX_FIELDS} fields`);
                    });
                });

                it("Above maximum should throw error", () => {
                    const submitted_fields = [];
                    for (let i = 0; i < MAX_FIELDS + 1; ++i) {
                        // Preventing interference from duplicate error
                        submitted_fields.push("RAND0M_5TR1NG!!--0" + i);
                    }
                    const ad = new Ad({
                        fields: submitted_fields,
                    });

                    return ad.validate(err => {
                        should.exist(err.errors.fields);
                        err.errors.fields.should.have.property("kind").equal("user defined");
                        err.errors.fields.should.have.property("message").equal(`There must be between ${MIN_FIELDS} and ${MAX_FIELDS} fields`);
                    });
                });

                it("Inside the range should not throw error", () => {
                    const submitted_fields = [];
                    for (let i = 0; i < MIN_FIELDS; ++i) {
                        // Preventing interference from duplicate error
                        submitted_fields.push("RAND0M_5TR1NG!!--0" + i);
                    }
                    const ad = new Ad({
                        fields: submitted_fields,
                    });

                    return ad.validate(err => {
                        should.not.exist(err.errors.fields);
                    });
                });
            });

            describe(`'technologies' must have between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES} values`, () => {
                it("Below minimum throws error", () => {
                    const ad = new Ad({});
                    return ad.validate(err => {
                        should.exist(err.errors.technologies);
                        err.errors.technologies.should.have.property("kind").equal("user defined");
                        err.errors.technologies.should.have.property("message").equal(`There must be between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES} technologies`);
                    });
                });

                it("Above maximum throws error", () => {
                    const submitted_technologies = [];
                    for (let i = 0; i < MAX_TECHNOLOGIES + 1; ++i) {
                        // Preventing interference from duplicate error
                        submitted_technologies.push("RAND0M_5TR1NG!!--0" + i);
                    }
                    const ad = new Ad({
                        technologies: submitted_technologies,
                    });

                    return ad.validate(err => {
                        should.exist(err.errors.technologies);
                        err.errors.technologies.should.have.property("kind").equal("user defined");
                        err.errors.technologies.should.have.property("message").equal(`There must be between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES} technologies`);
                    });
                });

                it("Inside the range does not throw error", () => {
                    const submitted_technologies = [];
                    for (let i = 0; i < MIN_TECHNOLOGIES + 1; ++i) {
                        // Preventing interference from duplicate error
                        submitted_technologies.push("RAND0M_5TR1NG!!--0" + i);
                    }
                    const ad = new Ad({
                        technologies: submitted_technologies,
                    });

                    return ad.validate(err => {
                        should.not.exist(err.errors.technologies);
                    });
                });
            });

            describe("There must be at least one contact", () => {
                it("No contacts throws error", () => {
                    const test_contacts = new Map();

                    const ad = new Ad({
                        contacts: test_contacts,
                    });
    
                    return ad.validate(err => {
                        should.exist(err.errors.contacts);
                        err.errors.contacts.should.have.property("kind").equal("user defined");
                        err.errors.contacts.should.have.property("message").equal("There must be at least one contact");
                    });
                });

                it("At least 1 contact does not throw error", () => {
                    const test_contacts = new Map();
                    test_contacts.set("email", "memes@niaefeup.pt");

                    const ad = new Ad({
                        contacts: test_contacts,
                    });

                    return ad.validate(err => {
                        should.not.exist(err.errors.contacts);
                    });
                });
                
            });
        });

        describe("special cases", () => {
            describe("TODO: jobMinDuration is required if jobMaxDuration exists, but is not otherwise", () => {
                it("TODO");
            });
        });
    });

    describe("Property values inside enums tests", () => {
        it("Fields must be in the specified FieldTypes", () => {
            const inexistant_field_base = FieldTypes[0] + "!!THIS_DOES_NOT_EXIST_FOR_SURE-0";
            const submitted_fields = [];
            for (let i = 0; i < MIN_FIELDS; ++i) {
                submitted_fields.push(inexistant_field_base + i);
            }

            const ad = new Ad({
                fields: submitted_fields
            });

            return ad.validate(err => {
                for (let i = 0; i < submitted_fields.length; ++i) {
                    const curr_field_str = `fields.${i}`;
                    should.exist(err.errors[curr_field_str]);
                    err.errors[curr_field_str].should.have.property("kind").equal("enum");
                    err.errors[curr_field_str].should.have.property("message").equal(`\`${submitted_fields[i]}\` is not a valid enum value for path \`fields\`.`);
                }
            });
        });

        it("Technologies must be in the specified TechnologyTypes", () => {
            const inexistant_technology_base = TechnologyTypes[0] + "!!THIS_DOES_NOT_EXIST_FOR_SURE-0";
            const submitted_technologies = [];
            for (let i = 0; i < MIN_TECHNOLOGIES; ++i) {
                submitted_technologies.push(inexistant_technology_base + i);
            }

            const ad = new Ad({
                technologies: submitted_technologies
            });

            return ad.validate(err => {
                for (let i = 0; i < submitted_technologies.length; ++i) {
                    const curr_technology_str = `technologies.${i}`;
                    should.exist(err.errors[curr_technology_str]);
                    err.errors[curr_technology_str].should.have.property("kind").equal("enum");
                    err.errors[curr_technology_str].should.have.property("message").equal(`\`${submitted_technologies[i]}\` is not a valid enum value for path \`technologies\`.`);
                }
            });
        });

        it("JobType must be in the specified JobTypes", () => {
            const inexistant_jobtype = JobTypes[0] + "!!THIS_DOES_NOT_EXIST_FOR_SURE-421";

            const ad = new Ad({
                jobType: inexistant_jobtype
            });

            return ad.validate(err => {
                should.exist(err.errors.jobType);
                err.errors.jobType.should.have.property("kind").equal("enum");
                err.errors.jobType.should.have.property("message").equal(`\`${inexistant_jobtype}\` is not a valid enum value for path \`jobType\`.`);
            });
        });
    });

    describe("Unique properties tests", () => {
        it("'fields' must be unique");

        it("'technologies' must be unique");
    });

    describe("Custom property validator tests", () => {
        it("TODO: Publish Date must be smaller than the End Date");

        it(`TODO: End Date must not differ from the Publish Date by more than ${AD_MAX_LIFETIME_MONTHS} months`);
        // All custom validators that do not fit in other categories, such as date validation, etc
        it("TODO: jobMaxDuration must be larger than jobMinDuration");

        it("TODO: Test Location format insertion");
    });
});