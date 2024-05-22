import CV from "../src/models/CV.js";


describe("# CV Schema tests", () => {
    describe("Required and bound properties tests", () => {

        test("'UserId' field is required", async () => {
            const cv = new CV();
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors.UserId).toBeDefined();
                expect(err.errors.UserId.kind).toBe("required");
            }
        });

        test("'cvFileUrl' field is not required", async () => {
            const cv = new CV({});
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors.projects).toBeUndefined();
            }
        });

        test("'languages' field  is required", async () => {
            const cv = new CV();
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors.languages).toBeDefined();
                expect(err.errors.languages.kind).toBe("user defined");
                expect(err.errors.languages.message).toBe("At least one language must be provided");
            }
        });

        test("'languages' array length must be one or more", async () => {
            const cv = new CV({ languages: [] });
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors.languages).toBeDefined();
                expect(err.errors.languages.kind).toBe("user defined");
                expect(err.errors.languages.message).toBe("At least one language must be provided");
            }
        });

        test("'languages' array item must have language", async () => {
            const cv = new CV({ languages: [{ level: "Advanced" }] });
            try {
                await cv.validate();
            } catch (err) {
                /* eslint-disable no-alert, no-console */
                console.log("proj err", err);
                expect(err.errors["languages.0.language"]).toBeDefined();
                expect(err.errors["languages.0.language"].kind).toBe("required");
            }
        });

        test("'languages' array item must have level", async () => {
            const cv = new CV({ languages: [{ language: "English" }] });
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors["languages.0.level"]).toBeDefined();
                expect(err.errors["languages.0.level"].kind).toBe("required");
            }
        });

        test("'skills' field is not required", async () => {
            const cv = new CV({});
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors.skills).toBeUndefined();
            }
        });

        test("'achievements' field", async () => {
            const cv = new CV({});
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors.achievements).toBeUndefined();
            }
        });

        test("'events' field", async () => {
            const cv = new CV({});
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors.events).toBeUndefined();
            }
        });

        test("'cvFileUrl' field", async () => {
            const cv = new CV({});
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors.cvFileUrl).toBeUndefined();
            }
        });

        test("'personalWebsite' field", async () => {
            const cv = new CV({});
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors.personalWebsite).toBeUndefined();
            }
        });
        test("'personalizedFields' field", async () => {
            const cv = new CV({});
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors.personalizedFields).toBeUndefined();
            }
        });
        test("'personalizedFields' array item must have fieldName", async () => {
            const cv = new CV({ personalizedFields: [{ value: "value" }] });
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors["personalizedFields.0.fieldName"]).toBeDefined();
                expect(err.errors["personalizedFields.0.fieldName"].kind).toBe("required");
            }
        });
        test("'personalizedFields' array item must have value", async () => {
            const cv = new CV({ personalizedFields: [{ fieldName: "fieldName" }] });
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors["personalizedFields.0.value"]).toBeDefined();
                expect(err.errors["personalizedFields.0.value"].kind).toBe("required");
            }
        });
        test("'description' ", async () => {
            const cv = new CV({});
            try {
                await cv.validate();
            } catch (err) {
                expect(err.errors.description).toBeUndefined();
            }
        });
    });


});
