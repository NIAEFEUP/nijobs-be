import { StatusCodes } from "http-status-codes";
import { MAX_FILE_SIZE_MB } from "../../../../src/api/middleware/utils";
import ValidationReasons from "../../../../src/api/middleware/validators/validationReasons";
import hash from "../../../../src/lib/passwordHashing";
import Account from "../../../../src/models/Account";
import Company from "../../../../src/models/Company";
import Offer from "../../../../src/models/Offer";
import CompanyConstants from "../../../../src/models/constants/Company";
import withGodToken from "../../../utils/GodToken";
import { DAY_TO_MS } from "../../../utils/TimeConstants";
import ValidatorTester from "../../../utils/ValidatorTester";

describe("PUT /company/edit", () => {

    const generateTestCompany = (params) => ({
        name: "Big Company",
        bio: "Big Company Bio",
        logo: "http://awebsite.com/alogo.jpg",
        contacts: ["112", "122"],
        hasFinishedRegistration: true,
        ...params,
    });

    const test_agent = agent();

    const edit_payload = {
        name: "Changed name",
        bio: "Changed bio",
        logo: "test/data/logo-niaefeup.png",
        contacts: ["123", "456"],
    };

    const test_user_admin = {
        email: "admin@email.com",
        password: "password123",
    };

    beforeAll(async () => {
        await Account.deleteMany({});
        await Company.deleteMany({});
        await Offer.deleteMany({});

        await Account.create({
            email: test_user_admin.email,
            password: await hash(test_user_admin.password),
            isAdmin: true,
        });
    });

    afterAll(async () => {
        await Company.deleteMany({});
        await Account.deleteMany({});
        await Offer.deleteMany({});
    });

    describe("ID Validation", () => {
        test("Should fail if id is not a valid ObjectID", async () => {
            const id = "123";
            const res = await test_agent
                .put(`/company/${id}/edit`)
                .send(withGodToken())
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    "location": "params",
                    "msg": ValidationReasons.OBJECT_ID,
                    "param": "companyId",
                    "value": id
                })
            ]));
        });

        test("Should fail if id is not a valid company", async () => {
            const id = "111111111111111111111111";

            const res = await test_agent
                .put(`/company/${id}/edit`)
                .send(withGodToken())
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    "location": "params",
                    "msg": ValidationReasons.COMPANY_NOT_FOUND(id),
                    "param": "companyId",
                    "value": id
                })
            ]));
        });
    });

    describe("Field Validation", () => {

        const company_data = {
            name: "Test Company",
            logo: "http://awebsite.com/alogo.jpg",
        };

        let company;

        beforeAll(async () => {
            company = await Company.create(company_data);
        });

        afterAll(async () => {
            await Company.deleteMany({ name: company.name });
        });

        const EndpointValidatorTester = ValidatorTester(
            (params) => request().put(`/company/${company._id}/edit`).send(withGodToken(params))
        );
        const BodyValidatorTester = EndpointValidatorTester("body");

        describe("name", () => {
            const FieldValidatorTester = BodyValidatorTester("name");

            FieldValidatorTester.mustBeString();
            FieldValidatorTester.hasMaxLength(CompanyConstants.companyName.max_length);
            FieldValidatorTester.hasMinLength(CompanyConstants.companyName.min_length);
        });

        describe("bio", () => {
            const FieldValidatorTester = BodyValidatorTester("bio");

            FieldValidatorTester.mustBeString();
            FieldValidatorTester.hasMaxLength(CompanyConstants.bio.max_length);
        });

        describe("contacts", () => {
            const FieldValidatorTester = BodyValidatorTester("contacts");

            FieldValidatorTester.mustBeArray();
            // FieldValidatorTester.mustHaveAtLeast(CompanyConstants.contacts.min_length);
            FieldValidatorTester.mustBeArrayBetween(CompanyConstants.contacts.min_length, CompanyConstants.contacts.max_length);
        });

        describe("logo", () => {
            // TODO: Add tests for logo when the route has multer middleware to handle file uploads
        });
    });

    describe("Without auth", () => {

        const company_data = generateTestCompany({
            name: "Test Company",
        });
        let test_company;

        beforeAll(async () => {
            test_company = await Company.create(company_data);
        });

        afterAll(async () => {
            await Company.deleteMany({ name: test_company.name });
        });

        test("Should fail if not logged in", async () => {
            const res = await test_agent
                .put(`/company/${test_company._id}/edit`)
                .send({
                    bio: edit_payload.bio,
                    contacts: edit_payload.contacts,
                })
                .expect(StatusCodes.UNAUTHORIZED);

            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    "msg": ValidationReasons.INSUFFICIENT_PERMISSIONS
                })
            ]));
        });
    });

    describe("With auth", () => {

        const test_user_company_1 = {
            email: "company1@email.com",
            password: "password123",
        };
        const test_user_company_2 = {
            email: "company2@email.com",
            password: "password123",
        };

        const test_company_1_data = generateTestCompany({
            name: "Test Company 1",
        });
        const test_company_2_data = generateTestCompany({
            name: "Test Company 2",
        });
        const test_company_god_data = generateTestCompany({
            name: "Test Company God",
        });

        let test_company_1, test_company_2, test_company_god;

        beforeAll(async () => {

            [
                test_company_1,
                test_company_2,
                test_company_god,
            ] = await Company.create([
                test_company_1_data,
                test_company_2_data,
                test_company_god_data,
            ]);

            await Account.create([
                {
                    email: test_user_company_1.email,
                    password: await hash(test_user_company_1.password),
                    company: test_company_1._id,
                },
                {
                    email: test_user_company_2.email,
                    password: await hash(test_user_company_2.password),
                    company: test_company_2._id,
                },
            ]);
        });

        afterAll(async () => {
            await Company.deleteMany({
                _id: {
                    $in: [
                        test_company_god._id,
                        test_company_1._id,
                        test_company_2._id,
                    ]
                }
            });
            await Account.deleteMany({
                email: {
                    $in: [
                        test_user_admin.email,
                        test_user_company_1.email,
                        test_user_company_2.email,
                    ]
                }
            });
        });

        afterEach(async () => {
            await test_agent
                .delete("/auth/login")
                .expect(StatusCodes.OK);
        });

        test("Should fail if logged in as different user", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_company_1)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .put(`/company/${test_company_2._id}/edit`)
                .send({
                    name: edit_payload.name,
                })
                .expect(StatusCodes.FORBIDDEN);

            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    "msg": ValidationReasons.INSUFFICIENT_PERMISSIONS_COMPANY_SETTINGS
                })
            ]));
        });

        test("Should succeed if god", async () => {
            const res = await test_agent
                .put(`/company/${test_company_god._id}/edit`)
                .send(withGodToken({
                    name: edit_payload.name,
                    bio: edit_payload.bio,
                }))
                .expect(StatusCodes.OK);

            expect(res.body).toEqual(expect.objectContaining({
                _id: test_company_god._id.toString(),
                name: edit_payload.name,
                bio: edit_payload.bio,
            }));
        });

        test("Should succeed if admin", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .put(`/company/${test_company_1._id}/edit`)
                .send({
                    name: edit_payload.name
                })
                .expect(StatusCodes.OK);

            expect(res.body).toEqual(expect.objectContaining({
                name: edit_payload.name,
            }));
        });

        test("Should succeed if same company", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_company_2)
                .expect(StatusCodes.OK);

            const res = await test_agent
                .put(`/company/${test_company_2._id}/edit`)
                .send({
                    name: edit_payload.name,
                })
                .expect(StatusCodes.OK);

            expect(res.body).toEqual(expect.objectContaining({
                name: edit_payload.name,
            }));
        });

        describe("Blocked company", () => {

            const test_user_company_blocked = {
                email: "blocked@email.com",
                password: "password123",
            };

            const test_company_blocked_data = generateTestCompany({
                name: "Test Company God",
                isBlocked: true
            });
            let test_company_blocked;

            beforeAll(async () => {
                test_company_blocked = await Company.create(test_company_blocked_data);

                await Account.create({
                    email: test_user_company_blocked.email,
                    password: await hash(test_user_company_blocked.password),
                    company: test_company_blocked._id,
                });
            });

            afterAll(async () => {
                await Company.deleteMany({
                    _id: test_company_blocked._id
                });
                await Account.deleteMany({ email: test_user_company_blocked.email });
            });

            test("Should fail if company is blocked (god)", async () => {
                const res = await test_agent
                    .put(`/company/${test_company_blocked._id}/edit`)
                    .send(withGodToken({
                        name: "Changing Blocked Company",
                    }))
                    .expect(StatusCodes.FORBIDDEN);

                expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                    expect.objectContaining({
                        "msg": ValidationReasons.COMPANY_BLOCKED
                    })
                ]));
            });

            test("Should fail if company is blocked (user)", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company_blocked)
                    .expect(StatusCodes.OK);

                const res = await test_agent
                    .put(`/company/${test_company_blocked._id}/edit`)
                    .send({
                        name: "Changing Blocked Company",
                    })
                    .expect(StatusCodes.FORBIDDEN);

                expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                    expect.objectContaining({
                        "msg": ValidationReasons.COMPANY_BLOCKED
                    })
                ]));
            });
        });

        describe("Disabled company", () => {

            const test_user_company_disabled = {
                email: "disabled@email.com",
                password: "password123",
            };

            const test_company_disabled_data = generateTestCompany({
                name: "Test Company God",
                isDisabled: true
            });
            let test_company_disabled;

            beforeAll(async () => {
                test_company_disabled = await Company.create(test_company_disabled_data);

                await Account.create({
                    email: test_user_company_disabled.email,
                    password: await hash(test_user_company_disabled.password),
                    company: test_company_disabled._id,
                });
            });

            afterAll(async () => {
                await Company.deleteMany({
                    _id: test_company_disabled._id
                });
                await Account.deleteMany({ email: test_user_company_disabled.email });
            });

            test("Should fail if company is disabled (god)", async () => {
                const res = await test_agent
                    .put(`/company/${test_company_disabled._id}/edit`)
                    .send(withGodToken({
                        name: "Changing Disabled Company",
                    }))
                    .expect(StatusCodes.FORBIDDEN);

                expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                    expect.objectContaining({
                        "msg": ValidationReasons.COMPANY_DISABLED
                    })
                ]));
            });

            test("Should fail if company is disabled (user)", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company_disabled)
                    .expect(StatusCodes.OK);

                const res = await test_agent
                    .put(`/company/${test_company_disabled._id}/edit`)
                    .send({
                        bio: "As user",
                    })
                    .expect(StatusCodes.FORBIDDEN);

                expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                    expect.objectContaining({
                        "msg": ValidationReasons.COMPANY_DISABLED
                    })
                ]));
            });
        });

        describe("With Offers", () => {

            const generateTestOffer = (params) => ({
                title: "Test Offer",
                publishDate: (new Date()).toISOString(),
                publishEndDate: (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
                description: "For Testing Purposes",
                contacts: ["geral@niaefeup.pt", "229417766"],
                jobType: "SUMMER INTERNSHIP",
                jobMinDuration: 1,
                jobMaxDuration: 6,
                fields: ["DEVOPS", "BACKEND", "OTHER"],
                technologies: ["React", "CSS"],
                location: "Testing Street, Test City, 123",
                isHidden: false,
                requirements: ["The candidate must be tested", "Fluent in testJS"],
                ...params,
            });

            const test_user_company_with_offers = {
                email: "offers@email.com",
                password: "password123",
            };

            const test_company_with_offers_data = generateTestCompany({
                name: "Test Company God",
                logo: "https://test.com/logo.png",
            });
            let test_company_with_offers;
            let offer;

            beforeAll(async () => {
                test_company_with_offers = await Company.create(test_company_with_offers_data);

                await Account.create({
                    email: test_user_company_with_offers.email,
                    password: await hash(test_user_company_with_offers.password),
                    company: test_company_with_offers._id,
                });

                offer = await Offer.create(
                    generateTestOffer({
                        owner: test_company_with_offers._id,
                        ownerName: test_company_with_offers.name,
                        ownerLogo: test_company_with_offers.logo,
                    })
                );
            });

            afterAll(async () => {
                await Company.deleteMany({
                    _id: test_company_with_offers._id
                });
                await Account.deleteMany({ email: test_user_company_with_offers.email });
                await Offer.deleteMany({ owner: test_company_with_offers._id });
            });

            test("Offer should be updated", async () => {

                let test_offer = await Offer.findById(offer._id);

                expect(test_offer).not.toHaveProperty("ownerName", edit_payload.name);
                expect(test_offer).not.toHaveProperty("contacts", edit_payload.contacts);

                await test_agent
                    .post("/auth/login")
                    .send(test_user_company_with_offers)
                    .expect(StatusCodes.OK);

                const res = await test_agent
                    .put(`/company/${test_company_with_offers._id}/edit`)
                    .send({
                        name: edit_payload.name,
                        contacts: edit_payload.contacts,
                    })
                    .expect(StatusCodes.OK);

                expect(res.body).toEqual(expect.objectContaining({
                    name: edit_payload.name,
                    contacts: edit_payload.contacts,
                }));

                test_offer = await Offer.findById(offer._id);

                expect(test_offer).toHaveProperty("ownerName", edit_payload.name);
                expect(test_offer).toHaveProperty("contacts", edit_payload.contacts);
            });
        });

        describe("Updating company logo", () => {

            let company_with_logo;
            const company_with_logo_data = generateTestCompany({
                name: "Test Company With Logo",
                logo: "https://test.com/logo.png",
            });

            beforeAll(async () => {
                company_with_logo = await Company.create(company_with_logo_data);
            });

            afterAll(async () => {
                await Company.deleteMany({ _id: company_with_logo._id });
            });

            beforeEach(async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(StatusCodes.OK);
            });

            afterEach(async () => {
                await test_agent
                    .delete("/auth/login")
                    .expect(StatusCodes.OK);
            });

            test("Should fail if not an image", async () => {
                const res = await test_agent
                    .put(`/company/${company_with_logo._id}/edit`)
                    .attach("logo", "test/data/not-a-logo.txt")
                    .expect(StatusCodes.UNPROCESSABLE_ENTITY);

                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": ValidationReasons.IMAGE_FORMAT,
                    "param": "logo"
                });
            });

            test("Should fail if image is too big", async () => {
                const res = await test_agent
                    .put(`/company/${company_with_logo._id}/edit`)
                    .attach("logo", "test/data/logo-niaefeup-10mb.png")
                    .expect(StatusCodes.UNPROCESSABLE_ENTITY);

                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": ValidationReasons.FILE_TOO_LARGE(MAX_FILE_SIZE_MB),
                    "param": "logo"
                });
            });

            test("Should succeed if image is valid", async () => {
                const res = await test_agent
                    .put(`/company/${company_with_logo._id}/edit`)
                    .attach("logo", edit_payload.logo)
                    .expect(StatusCodes.OK);

                expect(res.body).toHaveProperty("logo");
            });
        });
    });
});
