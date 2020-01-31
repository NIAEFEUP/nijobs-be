const SchemaTester = (Model) => ({
    fieldRequired: (fieldName, customObject = {}) => {
        test(`'${fieldName}' is required`, async () => {
            const modelInstance = new Model(customObject);
            try {
                await modelInstance.validate();
            } catch (err) {
                expect(err.errors[fieldName]).toBeDefined();
                expect(err.errors[fieldName]).toHaveProperty("kind", "required");
                expect(err.errors[fieldName]).toHaveProperty("message", `Path \`${fieldName}\` is required.`);
            }
        });
    },

    minLength: (fieldName, minimum) => {
        describe(`${fieldName} must have a minimum of ${minimum} characters`, () => {
            test("less than minimum bound should throw error", async () => {
                const model = new Model({
                    [fieldName]: "a".repeat(minimum - 1),
                });
                try {
                    await model.validate();
                } catch (err) {
                    expect(err.errors[fieldName]).toBeDefined();
                    expect(err.errors[fieldName]).toHaveProperty("kind", "minlength");
                    expect(err.errors[fieldName]).toHaveProperty("message",
                        `Path \`${fieldName}\` (\`${"a".repeat(minimum - 1)}\`) is shorter than the minimum allowed length (${minimum}).`
                    );
                }
            });
            test("at the minimum should not throw error", async () => {
                const model = new Model({
                    [fieldName]: "a".repeat(minimum),
                });
                try {
                    await model.validate();
                } catch (err) {
                    expect(err.errors[fieldName]).not.toBeDefined();
                }
            });

        });
    },

    maxLength: (fieldName, maximum) => {
        describe(`${fieldName} must have a maximum of ${maximum} characters`, () => {
            test("more than the maximum should throw error", async () => {
                const model = new Model({
                    [fieldName]: "a".repeat(maximum + 1),
                });

                try {
                    await model.validate();
                } catch (err) {
                    expect(err.errors[fieldName]).toBeDefined();
                    expect(err.errors[fieldName]).toHaveProperty("kind", "maxlength");
                    expect(err.errors[fieldName]).toHaveProperty("message",
                        `Path \`${fieldName}\` (\`${"a".repeat(maximum + 1)}\`) is longer than the maximum allowed length (${maximum}).`
                    );
                }
            });
            test("at the maximum should not throw error", async () => {
                const model = new Model({
                    [fieldName]: "a".repeat(maximum),
                });
                try {
                    await model.validate();
                } catch (err) {
                    expect(err.errors[fieldName]).not.toBeDefined();
                }
            });

        });
    },

    dateAfterDate: (laterDate, earlierDate) => {
        describe(`'${laterDate}' must be after '${earlierDate}'`, () => {
            test(`${earlierDate} after ${laterDate} should thrown error`, async () => {
                const model = new Model({
                    [earlierDate]: new Date("02/01/2020"),
                    [laterDate]: new Date("01/01/2020"),
                });

                try {
                    await model.validate();
                } catch (err) {
                    expect(err.errors[laterDate]).toBeDefined();
                    expect(err.errors[laterDate]).toHaveProperty("kind", "user defined");
                    expect(err.errors[laterDate]).toHaveProperty("message", `\`${laterDate}\` must be after \`${earlierDate}\``);
                }
            });

            test(`${laterDate} after ${earlierDate} should not thrown error`, async () => {
                const model = new Model({
                    [earlierDate]: new Date("01/01/2020"),
                    [laterDate]: new Date("02/01/2020"),
                });

                try {
                    await model.validate();
                } catch (err) {
                    expect(err.errors[laterDate]).not.toBeDefined();
                }
            });
        });
    },

    mutuallyExclusive: (firstField, secondField, customObject) => {
        describe(`${firstField} and ${secondField} must be mutually exclusive`, () => {
            test(`if ${firstField} and ${secondField} are defined an error should be thrown`, async () => {
                const model = new Model(customObject);

                try {
                    await model.validate();
                } catch (err) {
                    expect(err.errors[firstField]).toBeDefined();
                    expect(err.errors[firstField]).toHaveProperty("kind", "user defined");
                    expect(err.errors[firstField]).toHaveProperty("message",
                        `\`${firstField}\` and \`${secondField}\` are mutually exclusive`);
                }
            });

            test(`if only ${firstField} is defined it should not throw error`, async () => {
                const onlyFirst =  { ...customObject };
                delete onlyFirst[secondField];
                const model = new Model(onlyFirst);

                try {
                    await model.validate();
                } catch (err) {
                    expect(err.errors[firstField]).not.toBeDefined();
                }
            });

            test(`if only ${secondField} is defined it should not throw error`, async () => {
                const onlySecond =  { ...customObject };
                delete onlySecond[firstField];
                const model = new Model(onlySecond);

                try {
                    await model.validate();
                } catch (err) {
                    expect(err.errors[firstField]).not.toBeDefined();
                }
            });
        });
    },
});

module.exports = SchemaTester;
