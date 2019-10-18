const Offer = require("../src/models/Offer");
const JobTypes = require("../src/models/JobTypes");
const { MIN_FIELDS, MAX_FIELDS, FieldTypes } = require("../src/models/FieldTypes");
const { MIN_TECHNOLOGIES, MAX_TECHNOLOGIES, TechnologyTypes } = require("../src/models/TechnologyTypes");
const { OFFER_MAX_LIFETIME_MONTHS } = require("../src/models/TimeConstants");

describe("# Offer Schema tests", () => {
    describe("Required and bound (between min and max elements) properties tests", () => {
        describe("required using schema 'required' property (no user defined validators)", () => {
            test("'title' is required", () => {
                const offer = new Offer({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return offer.validate((err) => {
                    expect(err.errors.title).toBeDefined();
                    expect(err.errors.title).toHaveProperty("kind", "required");
                    expect(err.errors.title).toHaveProperty("message", "Path `title` is required.");
                });
            });

            test("'publishDate' is required", () => {
                const offer = new Offer({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return offer.validate((err) => {
                    expect(err.errors.publishDate).toBeDefined();
                    expect(err.errors.publishDate).toHaveProperty("kind", "required");
                    expect(err.errors.publishDate).toHaveProperty("message", "Path `publishDate` is required.");
                });
            });

            test("'endDate' is required", () => {
                const offer = new Offer({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return offer.validate((err) => {
                    expect(err.errors.endDate).toBeDefined();
                    expect(err.errors.endDate).toHaveProperty("kind", "required");
                    expect(err.errors.endDate).toHaveProperty("message", "Path `endDate` is required.");
                });
            });

            test("'description' is required", () => {
                const offer = new Offer({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return offer.validate((err) => {
                    expect(err.errors.description).toBeDefined();
                    expect(err.errors.description).toHaveProperty("kind", "required");
                    expect(err.errors.description).toHaveProperty("message", "Path `description` is required.");
                });
            });

            test("'contacts' is required", () => {
                const offer = new Offer({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return offer.validate((err) => {
                    expect(err.errors.contacts).toBeDefined();
                    expect(err.errors.contacts).toHaveProperty("kind", "required");
                    expect(err.errors.contacts).toHaveProperty("message", "Path `contacts` is required.");
                });
            });

            test("'jobType' is required", () => {
                const offer = new Offer({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return offer.validate((err) => {
                    expect(err.errors.jobType).toBeDefined();
                    expect(err.errors.jobType).toHaveProperty("kind", "required");
                    expect(err.errors.jobType).toHaveProperty("message", "Path `jobType` is required.");
                });
            });

            test("'owner' is required", () => {
                const offer = new Offer({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return offer.validate((err) => {
                    expect(err.errors.owner).toBeDefined();
                    expect(err.errors.owner).toHaveProperty("kind", "required");
                    expect(err.errors.owner).toHaveProperty("message", "Path `owner` is required.");
                });
            });

            test("'location' is required", () => {
                const offer = new Offer({});
                // Returning the validation promise to ensure the test doesn't finish before all the assertions do
                return offer.validate((err) => {
                    expect(err.errors.location).toBeDefined();
                    expect(err.errors.location).toHaveProperty("kind", "required");
                    expect(err.errors.location).toHaveProperty("message", "Path `location` is required.");
                });
            });
        });

        describe("required using custom validators (checking for array lengths, etc)", () => {
            describe(`'fields' must have between ${MIN_FIELDS} and ${MAX_FIELDS} values`, () => {
                test("Below minimum should throw error", () => {
                    const offer = new Offer({});
                    return offer.validate((err) => {
                        expect(err.errors.fields).toBeDefined();
                        expect(err.errors.fields).toHaveProperty("kind", "user defined");
                        expect(err.errors.fields).toHaveProperty("message", `There must be between ${MIN_FIELDS} and ${MAX_FIELDS} fields`);
                    });
                });

                test("Above maximum should throw error", () => {
                    const submitted_fields = [];
                    for (let i = 0; i < MAX_FIELDS + 1; ++i) {
                        // Preventing interference from duplicate error
                        submitted_fields.push(`RAND0M_5TR1NG!!--0${i}`);
                    }
                    const offer = new Offer({
                        fields: submitted_fields,
                    });

                    return offer.validate((err) => {
                        expect(err.errors.fields).toBeDefined();
                        expect(err.errors.fields).toHaveProperty("kind", "user defined");
                        expect(err.errors.fields).toHaveProperty("message", `There must be between ${MIN_FIELDS} and ${MAX_FIELDS} fields`);
                    });
                });

                test("Inside the range should not throw error", () => {
                    const submitted_fields = [];
                    for (let i = 0; i < MIN_FIELDS; ++i) {
                        // Preventing interference from duplicate error
                        submitted_fields.push(`RAND0M_5TR1NG!!--0${i}`);
                    }
                    const offer = new Offer({
                        fields: submitted_fields,
                    });

                    return offer.validate((err) => {
                        expect(err.errors.fields).toBeFalsy();
                    });
                });
            });

            describe(`'technologies' must have between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES} values`, () => {
                test("Below minimum throws error", () => {
                    const offer = new Offer({});
                    return offer.validate((err) => {
                        expect(err.errors.technologies).toBeDefined();
                        expect(err.errors.technologies).toHaveProperty("kind", "user defined");
                        expect(err.errors.technologies).toHaveProperty("message",
                            `There must be between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES} technologies`
                        );
                    });
                });

                test("Above maximum throws error", () => {
                    const submitted_technologies = [];
                    for (let i = 0; i < MAX_TECHNOLOGIES + 1; ++i) {
                        // Preventing interference from duplicate error
                        submitted_technologies.push(`RAND0M_5TR1NG!!--0${i}`);
                    }
                    const offer = new Offer({
                        technologies: submitted_technologies,
                    });

                    return offer.validate((err) => {
                        expect(err.errors.technologies).toBeDefined();
                        expect(err.errors.technologies).toHaveProperty("kind", "user defined");
                        expect(err.errors.technologies).toHaveProperty("message",
                            `There must be between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES} technologies`
                        );
                    });
                });

                test("Inside the range does not throw error", () => {
                    const submitted_technologies = [];
                    for (let i = 0; i < MIN_TECHNOLOGIES + 1; ++i) {
                        // Preventing interference from duplicate error
                        submitted_technologies.push(`RAND0M_5TR1NG!!--0${i}`);
                    }
                    const offer = new Offer({
                        technologies: submitted_technologies,
                    });

                    return offer.validate((err) => {
                        expect(err.errors.technologies).toBeFalsy();
                    });
                });
            });

            describe("There must be at least one contact", () => {
                test("No contacts throws error", () => {
                    const test_contacts = new Map();

                    const offer = new Offer({
                        contacts: test_contacts,
                    });

                    return offer.validate((err) => {
                        expect(err.errors.contacts).toBeDefined();
                        expect(err.errors.contacts).toHaveProperty("kind", "user defined");
                        expect(err.errors.contacts).toHaveProperty("message", "There must be at least one contact");
                    });
                });

                test("At least 1 contact does not throw error", () => {
                    const test_contacts = new Map();
                    test_contacts.set("email", "memes@niaefeup.pt");

                    const offer = new Offer({
                        contacts: test_contacts,
                    });

                    return offer.validate((err) => {
                        expect(err.errors.contacts).toBeFalsy();
                    });
                });

            });
        });

        describe("special cases", () => {
            describe("'jobMinDuration' is required if 'jobMaxDuration' exists, but is not otherwise", () => {
                test("'jobMaxDuration' exists, should be required", () => {
                    const offer = new Offer({
                        jobMaxDuration: 8,
                    });

                    return offer.validate((err) => {
                        expect(err.errors.jobMinDuration).toBeDefined();
                        expect(err.errors.jobMinDuration).toHaveProperty("kind", "required");
                        expect(err.errors.jobMinDuration).toHaveProperty("message", "Path `jobMinDuration` is required.");
                    });
                });

                test("'jobMaxDuration' does not exist, should not be required", () => {
                    const offer = new Offer({});

                    return offer.validate((err) => {
                        expect(err.errors.jobMinDuration).toBeFalsy();
                    });
                });
            });
        });
    });

    describe("Property values inside enums tests", () => {
        test("Fields must be in the specified FieldTypes", () => {
            const inexistant_field_base = `${FieldTypes[0]}!!THIS_DOES_NOT_EXIST_FOR_SURE-0`;
            const submitted_fields = [];
            for (let i = 0; i < MIN_FIELDS; ++i) {
                submitted_fields.push(inexistant_field_base + i);
            }

            const offer = new Offer({
                fields: submitted_fields,
            });

            return offer.validate((err) => {
                for (let i = 0; i < submitted_fields.length; ++i) {
                    const curr_field_str = `fields.${i}`;
                    expect(err.errors[curr_field_str]).toBeDefined();
                    expect(err.errors[curr_field_str]).toHaveProperty("kind", "enum");
                    expect(err.errors[curr_field_str]).toHaveProperty("message",
                        `\`${submitted_fields[i]}\` is not a valid enum value for path \`fields\`.`
                    );
                }
            });
        });

        test("Technologies must be in the specified TechnologyTypes", () => {
            const inexistant_technology_base = `${TechnologyTypes[0]}!!THIS_DOES_NOT_EXIST_FOR_SURE-0`;
            const submitted_technologies = [];
            for (let i = 0; i < MIN_TECHNOLOGIES; ++i) {
                submitted_technologies.push(inexistant_technology_base + i);
            }

            const offer = new Offer({
                technologies: submitted_technologies,
            });

            return offer.validate((err) => {
                for (let i = 0; i < submitted_technologies.length; ++i) {
                    const curr_technology_str = `technologies.${i}`;
                    expect(err.errors[curr_technology_str]).toBeDefined();
                    expect(err.errors[curr_technology_str]).toHaveProperty("kind", "enum");
                    expect(err.errors[curr_technology_str]).toHaveProperty("message",
                        `\`${submitted_technologies[i]}\` is not a valid enum value for path \`technologies\`.`
                    );
                }
            });
        });

        test("JobType must be in the specified JobTypes", () => {
            const inexistant_jobtype = `${JobTypes[0]}!!THIS_DOES_NOT_EXIST_FOR_SURE-421`;

            const offer = new Offer({
                jobType: inexistant_jobtype,
            });

            return offer.validate((err) => {
                expect(err.errors.jobType).toBeDefined();
                expect(err.errors.jobType).toHaveProperty("kind", "enum");
                expect(err.errors.jobType).toHaveProperty("message",
                    `\`${inexistant_jobtype}\` is not a valid enum value for path \`jobType\`.`
                );
            });
        });
    });

    describe("Unique properties tests", () => {
        test("'fields' array must be unique", () => {
            const field_to_insert = FieldTypes[0];
            const submitted_fields = [];
            for (let i = 0; i < MIN_FIELDS; ++i) {
                // Preventing interference from duplicate error
                submitted_fields.push(field_to_insert);
            }
            const offer = new Offer({
                fields: submitted_fields,
            });

            return offer.validate((err) => {
                expect(err.errors.fields).toBeDefined();
                expect(err.errors.fields).toHaveProperty("kind", "user defined");
                expect(err.errors.fields).toHaveProperty("message", `Duplicate values in array \`fields\`: [${submitted_fields}]`);
            });
        });

        test("'technologies' array must be unique", () => {
            const technology_to_insert = TechnologyTypes[0];
            const submitted_technologies = [];
            // Ensuring that it is inside the range
            for (let i = 0; i < MIN_TECHNOLOGIES + 1; ++i) {
                submitted_technologies.push(technology_to_insert);
            }
            const offer = new Offer({
                technologies: submitted_technologies,
            });

            return offer.validate((err) => {
                expect(err.errors.technologies).toBeDefined();
                expect(err.errors.technologies).toHaveProperty("kind", "user defined");
                expect(err.errors.technologies).toHaveProperty("message",
                    `Duplicate values in array \`technologies\`: [${submitted_technologies}]`
                );
            });
        });
    });

    // All custom validators that do not fit in other categories, such as date validation, etc
    describe("Custom property validator tests", () => {
        describe("'publishDate' must be earlier than 'endDate'", () => {
            test("check for error", () => {
                const offer = new Offer({
                    publishDate: new Date("5 November, 2019"),
                    endDate: new Date("4 November, 2019"),
                });

                return offer.validate((err) => {
                    expect(err.errors.publishDate).toBeDefined();
                    expect(err.errors.publishDate).toHaveProperty("kind", "user defined");
                    expect(err.errors.publishDate).toHaveProperty("message", "`publishDate` must be earlier than `endDate`");
                });
            });

            test("check for success", () => {
                const offer = new Offer({
                    publishDate: new Date("4 November, 2019"),
                    endDate: new Date("5 November, 2019"),
                });

                return offer.validate((err) => {
                    expect(err.errors.publishDate).toBeFalsy();
                });
            });
        });

        describe(`'endDate' must not differ from 'publishDate' by more than ${OFFER_MAX_LIFETIME_MONTHS} months`, () => {
            test("check for error", () => {
                // According to Google :)
                const MONTH_TO_MS = 2.628e+9;
                const publishDate = new Date("01/01/1994");
                const offer = new Offer({
                    publishDate: publishDate,
                    endDate: new Date(publishDate.getTime() + ((OFFER_MAX_LIFETIME_MONTHS + 1) * MONTH_TO_MS)),
                });

                return offer.validate((err) => {
                    expect(err.errors.endDate).toBeDefined();
                    expect(err.errors.endDate).toHaveProperty("kind", "user defined");
                    expect(err.errors.endDate).toHaveProperty("message",
                        `\`endDate\` must not differ from \`publishDate\` by more than ${OFFER_MAX_LIFETIME_MONTHS} months`
                    );
                });
            });

            test("check for success", () => {
                const offer = new Offer({
                    publishDate: new Date("01/01/1994"),
                    endDate: new Date("02/01/1994"),
                });

                return offer.validate((err) => {
                    expect(err.errors.endDate).toBeFalsy();
                });
            });
        });
        describe("'jobMaxDuration' must be larger than 'jobMinDuration'", () => {
            test("check for error", () => {
                const offer = new Offer({
                    jobMinDuration: 5,
                    jobMaxDuration: 1,
                });

                return offer.validate((err) => {
                    expect(err.errors.jobMaxDuration).toBeDefined();
                    expect(err.errors.jobMaxDuration).toHaveProperty("kind", "user defined");
                    expect(err.errors.jobMaxDuration).toHaveProperty("message", "`jobMaxDuration` must be larger than `jobMinDuration`");
                });
            });

            test("check for success", () => {
                const offer = new Offer({
                    jobMinDuration: 1,
                    jobMaxDuration: 2,
                });

                return offer.validate((err) => {
                    expect(err.errors.jobMaxDuration).toBeFalsy();
                });

            });
        });

        describe("Test Location format insertion", () => {
            // More tests could be offerded to test erroring formats, but I think that this should be enough
            test("no object passed should throw error", () => {
                const offer = new Offer({
                    location: "",
                });

                return offer.validate((err) => {
                    expect(err.errors.location).toBeDefined();
                    expect(err.errors.location).toHaveProperty("kind", "Embedded");
                    expect(err.errors.location).toHaveProperty("message", "Cast to Embedded failed for value \"\" at path \"location\"");
                });
            });

            test("correct format should not throw error", () => {
                const offer = new Offer({
                    location: {
                        type: "Point",
                        coordinates: [27, 28],
                    },
                });

                return offer.validate((err) => {
                    expect(err.errors.location).toBeFalsy();
                });
            });
        });
    });
});
