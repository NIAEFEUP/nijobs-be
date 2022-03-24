import Offer from "../src/models/Offer";
import JobTypes from "../src/models/constants/JobTypes";
import { MIN_FIELDS, MAX_FIELDS, FieldTypes } from "../src/models/constants/FieldTypes";
import { MIN_TECHNOLOGIES, MAX_TECHNOLOGIES, TechnologyTypes } from "../src/models/constants/TechnologyTypes";
import { OFFER_MAX_LIFETIME_MONTHS } from "../src/models/constants/TimeConstants";

describe("# Offer Schema tests", () => {
    describe("Required and bound (between min and max elements) properties tests", () => {
        describe("required using schema 'required' property (no user defined validators)", () => {
            test("'title' is required", async () => {
                const offer = new Offer({});
                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.title).toBeDefined();
                    expect(err.errors.title).toHaveProperty("kind", "required");
                    expect(err.errors.title).toHaveProperty("message", "Path `title` is required.");
                }
            });

            test("'publishDate' is required", async () => {
                const offer = new Offer({});
                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.publishDate).toBeDefined();
                    expect(err.errors.publishDate).toHaveProperty("kind", "required");
                    expect(err.errors.publishDate).toHaveProperty("message", "Path `publishDate` is required.");
                }
            });

            test("'publishEndDate' is required", async () => {
                const offer = new Offer({});
                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.publishEndDate).toBeDefined();
                    expect(err.errors.publishEndDate).toHaveProperty("kind", "required");
                    expect(err.errors.publishEndDate).toHaveProperty("message", "Path `publishEndDate` is required.");
                }
            });

            test("'description' is required", async () => {
                const offer = new Offer({});
                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.description).toBeDefined();
                    expect(err.errors.description).toHaveProperty("kind", "required");
                    expect(err.errors.description).toHaveProperty("message", "Path `description` is required.");
                }
            });

            test("'contacts' is required", async () => {
                const offer = new Offer({});
                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.contacts).toBeDefined();
                    expect(err.errors.contacts).toHaveProperty("kind", "user defined");
                    expect(err.errors.contacts).toHaveProperty("message", "There must be at least one contact.");
                }
            });

            test("'jobType' is required", async () => {
                const offer = new Offer({});
                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.jobType).toBeDefined();
                    expect(err.errors.jobType).toHaveProperty("kind", "required");
                    expect(err.errors.jobType).toHaveProperty("message", "Path `jobType` is required.");
                }
            });

            test("'owner' is required", async () => {
                const offer = new Offer({});
                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.owner).toBeDefined();
                    expect(err.errors.owner).toHaveProperty("kind", "required");
                    expect(err.errors.owner).toHaveProperty("message", "Path `owner` is required.");
                }
            });

            test("'ownerName' is required", async () => {
                const offer = new Offer({});
                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.ownerName).toBeDefined();
                    expect(err.errors.ownerName).toHaveProperty("kind", "required");
                    expect(err.errors.ownerName).toHaveProperty("message", "Path `ownerName` is required.");
                }
            });

            test("'ownerLogo' is required", async () => {
                const offer = new Offer({});
                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.ownerLogo).toBeDefined();
                    expect(err.errors.ownerLogo).toHaveProperty("kind", "required");
                    expect(err.errors.ownerLogo).toHaveProperty("message", "Path `ownerLogo` is required.");
                }
            });

            test("'location' is required", async () => {
                const offer = new Offer({});
                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.location).toBeDefined();
                    expect(err.errors.location).toHaveProperty("kind", "required");
                    expect(err.errors.location).toHaveProperty("message", "Path `location` is required.");
                }
            });

            test("'requirements' is required", async () => {
                const offer = new Offer({});
                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.requirements).toBeDefined();
                    expect(err.errors.requirements).toHaveProperty("kind", "user defined");
                    expect(err.errors.requirements).toHaveProperty("message", "There must be at least one requirement");
                }
            });
        });

        describe("required using custom validators (checking for array lengths, etc)", () => {
            describe(`'fields' must have between ${MIN_FIELDS} and ${MAX_FIELDS} values`, () => {
                test("Below minimum should throw error", async () => {
                    const offer = new Offer({});
                    try {
                        await offer.validate();
                    } catch (err) {
                        expect(err.errors.fields).toBeDefined();
                        expect(err.errors.fields).toHaveProperty("kind", "user defined");
                        expect(err.errors.fields).toHaveProperty("message",
                            `\`fields\` must have length between ${MIN_FIELDS} and ${MAX_FIELDS}`
                        );
                    }
                });

                test("Above maximum should throw error", async () => {
                    const submitted_fields = [];
                    for (let i = 0; i < MAX_FIELDS + 1; ++i) {
                        // Preventing interference from duplicate error
                        submitted_fields.push(`RAND0M_5TR1NG!!--0${i}`);
                    }
                    const offer = new Offer({
                        fields: submitted_fields,
                    });

                    try {
                        await offer.validate();
                    } catch (err) {
                        expect(err.errors.fields).toBeDefined();
                        expect(err.errors.fields).toHaveProperty("kind", "user defined");
                        expect(err.errors.fields).toHaveProperty("message",
                            `\`fields\` must have length between ${MIN_FIELDS} and ${MAX_FIELDS}`
                        );
                    }
                });

                test("Inside the range should not throw error", async () => {
                    const submitted_fields = [];
                    for (let i = 0; i < MIN_FIELDS; ++i) {
                        // Preventing interference from duplicate error
                        submitted_fields.push(`RAND0M_5TR1NG!!--0${i}`);
                    }
                    const offer = new Offer({
                        fields: submitted_fields,
                    });

                    try {
                        await offer.validate();
                    } catch (err) {
                        expect(err.errors.fields).toBeFalsy();
                    }
                });
            });

            describe(`'technologies' must have between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES} values`, () => {
                test("Below minimum throws error", async () => {
                    const offer = new Offer({});
                    try {
                        await offer.validate();
                    } catch (err) {
                        expect(err.errors.technologies).toBeDefined();
                        expect(err.errors.technologies).toHaveProperty("kind", "user defined");
                        expect(err.errors.technologies).toHaveProperty("message",
                            `\`technologies\` must have length between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES}`
                        );
                    }
                });

                test("Above maximum throws error", async () => {
                    const submitted_technologies = [];
                    for (let i = 0; i < MAX_TECHNOLOGIES + 1; ++i) {
                        // Preventing interference from duplicate error
                        submitted_technologies.push(`RAND0M_5TR1NG!!--0${i}`);
                    }
                    const offer = new Offer({
                        technologies: submitted_technologies,
                    });

                    try {
                        await offer.validate();
                    } catch (err) {
                        expect(err.errors.technologies).toBeDefined();
                        expect(err.errors.technologies).toHaveProperty("kind", "user defined");
                        expect(err.errors.technologies).toHaveProperty("message",
                            `\`technologies\` must have length between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES}`
                        );
                    }
                });

                test("Inside the range does not throw error", async () => {
                    const submitted_technologies = [];
                    for (let i = 0; i < MIN_TECHNOLOGIES + 1; ++i) {
                        // Preventing interference from duplicate error
                        submitted_technologies.push(`RAND0M_5TR1NG!!--0${i}`);
                    }
                    const offer = new Offer({
                        technologies: submitted_technologies,
                    });

                    try {
                        await offer.validate();
                    } catch (err) {
                        expect(err.errors.technologies).toBeFalsy();
                    }
                });
            });

            describe("There must be at least one contact", () => {
                test("No contacts throws error", async () => {
                    const test_contacts = [];

                    const offer = new Offer({
                        contacts: test_contacts,
                    });

                    try {
                        await offer.validate();
                    } catch (err) {
                        expect(err.errors.contacts).toBeDefined();
                        expect(err.errors.contacts).toHaveProperty("kind", "user defined");
                        expect(err.errors.contacts).toHaveProperty("message", "There must be at least one contact.");
                    }
                });

                test("At least 1 contact does not throw error", async () => {
                    const test_contacts = ["contact@niaefeup.pt"];

                    const offer = new Offer({
                        contacts: test_contacts,
                    });

                    try {
                        await offer.validate();
                    } catch (err) {
                        expect(err.errors.contacts).toBeFalsy();
                    }
                });

            });
        });

        describe("special cases", () => {
            describe("'jobMinDuration' is required if 'jobMaxDuration' exists, but is not otherwise", () => {
                test("'jobMaxDuration' exists, should be required", async () => {
                    const offer = new Offer({
                        jobMaxDuration: 8,
                    });

                    try {
                        await offer.validate();
                    } catch (err) {
                        expect(err.errors.jobMinDuration).toBeDefined();
                        expect(err.errors.jobMinDuration).toHaveProperty("kind", "required");
                        expect(err.errors.jobMinDuration).toHaveProperty("message", "Path `jobMinDuration` is required.");
                    }
                });

                test("'jobMaxDuration' does not exist, should not be required", async () => {
                    const offer = new Offer({});

                    try {
                        await offer.validate();
                    } catch (err) {
                        expect(err.errors.jobMinDuration).toBeFalsy();
                    }
                });
            });
        });
    });

    describe("Property values inside enums tests", () => {
        test("Fields must be in the specified FieldTypes", async () => {
            const inexistant_field_base = `${FieldTypes[0]}!!THIS_DOES_NOT_EXIST_FOR_SURE-0`;
            const submitted_fields = [];
            for (let i = 0; i < MIN_FIELDS; ++i) {
                submitted_fields.push(inexistant_field_base + i);
            }

            const offer = new Offer({
                fields: submitted_fields,
            });

            try {
                await offer.validate();
            } catch (err) {

                for (let i = 0; i < submitted_fields.length; ++i) {
                    const curr_field_str = `fields.${i}`;
                    expect(err.errors[curr_field_str]).toBeDefined();
                    expect(err.errors[curr_field_str]).toHaveProperty("kind", "enum");
                    expect(err.errors[curr_field_str]).toHaveProperty("message",
                        `\`${submitted_fields[i]}\` is not a valid enum value for path \`${curr_field_str}\`.`
                    );
                }
            }
        });

        test("Technologies must be in the specified TechnologyTypes", async () => {
            const inexistant_technology_base = `${TechnologyTypes[0]}!!THIS_DOES_NOT_EXIST_FOR_SURE-0`;
            const submitted_technologies = [];
            for (let i = 0; i < MIN_TECHNOLOGIES; ++i) {
                submitted_technologies.push(inexistant_technology_base + i);
            }

            const offer = new Offer({
                technologies: submitted_technologies,
            });

            try {
                await offer.validate();
            } catch (err) {
                for (let i = 0; i < submitted_technologies.length; ++i) {
                    const curr_technology_str = `technologies.${i}`;
                    expect(err.errors[curr_technology_str]).toBeDefined();
                    expect(err.errors[curr_technology_str]).toHaveProperty("kind", "enum");
                    expect(err.errors[curr_technology_str]).toHaveProperty("message",
                        `\`${submitted_technologies[i]}\` is not a valid enum value for path \`${curr_technology_str}\`.`
                    );
                }
            }
        });

        test("JobType must be in the specified JobTypes", async () => {
            const inexistant_jobtype = `${JobTypes[0]}!!THIS_DOES_NOT_EXIST_FOR_SURE-421`;

            const offer = new Offer({
                jobType: inexistant_jobtype,
            });

            try {
                await offer.validate();
            } catch (err) {
                expect(err.errors.jobType).toBeDefined();
                expect(err.errors.jobType).toHaveProperty("kind", "enum");
                expect(err.errors.jobType).toHaveProperty("message",
                    `\`${inexistant_jobtype}\` is not a valid enum value for path \`jobType\`.`
                );
            }
        });
    });

    describe("Unique properties tests", () => {
        test("'fields' array must be unique", async () => {
            const field_to_insert = FieldTypes[0];
            const submitted_fields = [];
            for (let i = 0; i < MIN_FIELDS + 1; ++i) {
                // Preventing interference from duplicate error
                submitted_fields.push(field_to_insert);
            }
            const offer = new Offer({
                fields: submitted_fields,
            });

            try {
                await offer.validate();
            } catch (err) {
                expect(err.errors.fields).toBeDefined();
                expect(err.errors.fields).toHaveProperty("kind", "user defined");
                expect(err.errors.fields).toHaveProperty("message", `Duplicate values in array \`fields\`: [${submitted_fields}]`);
            }
        });

        test("'technologies' array must be unique", async () => {
            const technology_to_insert = TechnologyTypes[0];
            const submitted_technologies = [];
            // Ensuring that it is inside the range
            for (let i = 0; i < MIN_TECHNOLOGIES + 1; ++i) {
                submitted_technologies.push(technology_to_insert);
            }
            const offer = new Offer({
                technologies: submitted_technologies,
            });

            try {
                await offer.validate();
            } catch (err) {
                expect(err.errors.technologies).toBeDefined();
                expect(err.errors.technologies).toHaveProperty("kind", "user defined");
                expect(err.errors.technologies).toHaveProperty("message",
                    `Duplicate values in array \`technologies\`: [${submitted_technologies}]`
                );
            }
        });
    });

    // All custom validators that do not fit in other categories, such as date validation, etc
    describe("Custom property validator tests", () => {
        describe("'publishDate' must be earlier than 'publishEndDate'", () => {
            test("check for error", async () => {
                const offer = new Offer({
                    publishDate: new Date("5 November, 2019"),
                    publishEndDate: new Date("4 November, 2019"),
                });

                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.publishDate).toBeDefined();
                    expect(err.errors.publishDate).toHaveProperty("kind", "user defined");
                    expect(err.errors.publishDate).toHaveProperty("message", "`publishDate` must be earlier than `publishEndDate`");
                }
            });

            test("check for success", async () => {
                const offer = new Offer({
                    publishDate: new Date("4 November, 2019"),
                    publishEndDate: new Date("5 November, 2019"),
                });

                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.publishDate).toBeFalsy();
                }
            });
        });

        describe(`'publishEndDate' must not differ from 'publishDate' by more than ${OFFER_MAX_LIFETIME_MONTHS} months`, () => {
            test("check for error", async () => {
                // According to Google :)
                const MONTH_TO_MS = 2.628e+9;
                const publishDate = new Date("01/01/1994");
                const offer = new Offer({
                    publishDate: publishDate,
                    publishEndDate: new Date(publishDate.getTime() + ((OFFER_MAX_LIFETIME_MONTHS + 1) * MONTH_TO_MS)),
                });

                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.publishEndDate).toBeDefined();
                    expect(err.errors.publishEndDate).toHaveProperty("kind", "user defined");
                    expect(err.errors.publishEndDate).toHaveProperty("message",
                        `\`publishEndDate\` must not differ from \`publishDate\` by more than ${OFFER_MAX_LIFETIME_MONTHS} months`
                    );
                }
            });

            test("check for success", async () => {
                const offer = new Offer({
                    publishDate: new Date("01/01/1994"),
                    publishEndDate: new Date("02/01/1994"),
                });

                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.publishEndDate).toBeFalsy();
                }
            });
        });
        describe("'jobMaxDuration' must be larger than 'jobMinDuration'", () => {
            test("check for error", async () => {
                const offer = new Offer({
                    jobMinDuration: 5,
                    jobMaxDuration: 1,
                });

                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.jobMaxDuration).toBeDefined();
                    expect(err.errors.jobMaxDuration).toHaveProperty("kind", "user defined");
                    expect(err.errors.jobMaxDuration).toHaveProperty("message", "`jobMaxDuration` must be larger than `jobMinDuration`");
                }
            });

            test("check for success", async () => {
                const offer = new Offer({
                    jobMinDuration: 1,
                    jobMaxDuration: 2,
                });

                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.jobMaxDuration).toBeFalsy();
                }

            });
        });

        describe("Test Coordinates format insertion", () => {
            // More tests could be offerded to test erroring formats, but I think that this should be enough
            test("no object passed should throw error", async () => {
                const offer = new Offer({
                    coordinates: "",
                });

                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.coordinates).toBeDefined();
                    expect(err.errors.coordinates).toHaveProperty("kind", "Embedded");
                    expect(err.errors.coordinates).toHaveProperty("message",
                        "Cast to Embedded failed for value \"\" (type string) at path \"coordinates\""
                    );
                }
            });

            test("correct format should not throw error", async () => {
                const offer = new Offer({
                    coordinates: {
                        type: "Point",
                        coordinates: [27, 28],
                    },
                });

                try {
                    await offer.validate();
                } catch (err) {
                    expect(err.errors.coordinates).toBeFalsy();
                }
            });
        });
    });
});
