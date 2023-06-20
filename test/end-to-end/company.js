import { StatusCodes as HTTPStatus } from "http-status-codes";
import ValidationReasons from "../../src/api/middleware/validators/validationReasons";
import hash from "../../src/lib/passwordHashing";
import Account from "../../src/models/Account";
import Company from "../../src/models/Company";
import Offer from "../../src/models/Offer";
import withGodToken from "../utils/GodToken";
import { DAY_TO_MS } from "../utils/TimeConstants";
import { MAX_FILE_SIZE_MB } from "../../src/api/middleware/utils";

describe("Company endpoint", () => {

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

    describe("PUT /company/edit", () => {

        const generateTestCompany = (params) => ({
            name: "Big Company",
            bio: "Big Company Bio",
            logo: "http://awebsite.com/alogo.jpg",
            contacts: ["112", "122"],
            hasFinishedRegistration: true,
            ...params,
        });

        let test_companies;
        let test_company, test_company_blocked, test_company_disabled;
        let test_offer;

        const changing_values = {
            name: "Changed name",
            bio: "Changed bio",
            logo: "test/data/logo-niaefeup.png",
            contacts: ["123", "456"],
        };

        /* Admin, Company, Blocked, Disabled*/
        const test_users = Array(4).fill({}).map((_c, idx) => ({
            email: `test_email_${idx}@email.com`,
            password: "password123",
        }));

        const [test_user_admin, test_user_company, test_user_company_blocked, test_user_company_disabled] = test_users;

        const test_agent = agent();

        beforeAll(async () => {
            await Account.deleteMany({});

            const test_company_data = await generateTestCompany();
            const test_company_blocked_data = await generateTestCompany({ isBlocked: true });
            const test_company_disabled_data = await generateTestCompany({ isDisabled: true });

            test_companies = await Company.create(
                [test_company_data, test_company_blocked_data, test_company_disabled_data],
                { session: null }
            );

            [test_company, test_company_blocked, test_company_disabled] = test_companies;

            test_offer = await Offer.create(
                generateTestOffer({
                    owner: test_company._id,
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                })
            );

            for (let i = 0; i < test_users.length; i++) {
                if (i === 0) {  // Admin
                    await Account.create({
                        email: test_users[i].email,
                        password: await hash(test_users[i].password),
                        isAdmin: true,
                    });
                } else {    // Company
                    await Account.create({
                        email: test_users[i].email,
                        password: await hash(test_users[i].password),
                        company: test_companies[i - 1]._id,
                    });
                }
            }
        });

        afterEach(async () => {
            await test_agent
                .delete("/auth/login")
                .expect(HTTPStatus.OK);
        });

        afterAll(async () => {
            await Company.deleteMany({});
            await Account.deleteMany({});
        });

        describe("ID Validation", () => {
            beforeEach(async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);
            });

            test("Should fail if id is not a valid ObjectID", async () => {
                const id = "123";
                const res = await test_agent
                    .put(`/company/${id}/edit`)
                    .send()
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body.errors).toContainEqual(
                    { "location": "params", "msg": ValidationReasons.OBJECT_ID, "param": "companyId", "value": id }
                );
            });

            test("Should fail if id is not a valid company", async () => {
                const id = "111111111111111111111111";

                const res = await test_agent
                    .put(`/company/${id}/edit`)
                    .send()
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body.errors).toContainEqual(
                    { "location": "params", "msg": ValidationReasons.COMPANY_NOT_FOUND(id), "param": "companyId", "value": id }
                );
            });
        });

        describe("Using a bad user", () => {
            test("Should fail if different user", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company_blocked)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .send({
                        name: changing_values.name,
                    })
                    .expect(HTTPStatus.FORBIDDEN);

                expect(res.body.errors).toContainEqual({ "msg": ValidationReasons.INSUFFICIENT_PERMISSIONS_COMPANY_SETTINGS });
            });

            test("Should fail if not logged in", async () => {
                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .send({
                        bio: changing_values.bio,
                        contacts: changing_values.contacts,
                    })
                    .expect(HTTPStatus.UNAUTHORIZED);

                expect(res.body.errors).toContainEqual({ "msg": ValidationReasons.INSUFFICIENT_PERMISSIONS });
            });
        });

        describe("Using a good user", () => {
            test("Should pass if god", async () => {
                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .send(withGodToken({
                        name: changing_values.name,
                        bio: changing_values.bio,
                    }))
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("name", changing_values.name);
                expect(res.body).toHaveProperty("bio", changing_values.bio);
            });

            test("Should pass if admin", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .field("name", changing_values.name)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("name", changing_values.name);
            });

            test("Should pass if same company", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .field("name", changing_values.name)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("name", changing_values.name);
            });
        });

        test("Offer should be updated", async () => {
            await test_agent
                .post("/auth/login")
                .send(test_user_company)
                .expect(HTTPStatus.OK);

            const res = await test_agent
                .put(`/company/${test_company._id}/edit`)
                .send({
                    name: changing_values.name,
                    contacts: changing_values.contacts,
                })
                .expect(HTTPStatus.OK);

            test_offer = await Offer.findById(test_offer._id);

            expect(res.body).toHaveProperty("name", changing_values.name);
            expect(res.body).toHaveProperty("contacts", changing_values.contacts);

            expect(test_offer.ownerName).toEqual(changing_values.name);
            expect(test_offer.contacts).toEqual(changing_values.contacts);
        });

        describe("Updating company logo", () => {
            test("Should fail if not an image", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .attach("logo", "test/data/not-a-logo.txt")
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": ValidationReasons.IMAGE_FORMAT,
                    "param": "logo"
                });
            });

            test("Should fail if image is too big", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .attach("logo", "test/data/logo-niaefeup-10mb.png")
                    .expect(HTTPStatus.UNPROCESSABLE_ENTITY);

                expect(res.body.errors).toContainEqual({
                    "location": "body",
                    "msg": ValidationReasons.FILE_TOO_LARGE(MAX_FILE_SIZE_MB),
                    "param": "logo"
                });
            });

            test("Should succeed if image is valid", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company._id}/edit`)
                    .attach("logo", changing_values.logo)
                    .expect(HTTPStatus.OK);

                expect(res.body).toHaveProperty("logo");
            });
        });

        describe("Using disabled/blocked company (god)", () => {
            test("Should fail if company is blocked (god)", async () => {
                const res = await test_agent
                    .put(`/company/${test_company_blocked._id}/edit`)
                    .send(withGodToken({
                        name: "Changing Blocked Company",
                    }))
                    .expect(HTTPStatus.FORBIDDEN);
                expect(res.body.errors).toContainEqual({ "msg": ValidationReasons.COMPANY_BLOCKED });
            });

            test("Should fail if company is disabled (god)", async () => {
                const res = await test_agent
                    .put(`/company/${test_company_disabled._id}/edit`)
                    .send(withGodToken({
                        name: "Changing Disabled Company",
                    }))
                    .expect(HTTPStatus.FORBIDDEN);
                expect(res.body.errors).toContainEqual({ "msg": ValidationReasons.COMPANY_DISABLED });
            });
        });

        describe("Using disabled/blocked company (user)", () => {
            test("Should fail if company is blocked (user)", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company_blocked)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company_blocked._id}/edit`)
                    .send({
                        name: "Changing Blocked Company",
                    })
                    .expect(HTTPStatus.FORBIDDEN);

                expect(res.body.errors).toContainEqual({ "msg": ValidationReasons.COMPANY_BLOCKED });
            });

            test("Should fail if company is disabled (user)", async () => {
                await test_agent
                    .post("/auth/login")
                    .send(test_user_company_disabled)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .put(`/company/${test_company_disabled._id}/edit`)
                    .send({
                        bio: "As user",
                    })
                    .expect(HTTPStatus.FORBIDDEN);
                expect(res.body.errors).toContainEqual({ "msg": ValidationReasons.COMPANY_DISABLED });
            });
        });
    });
});
