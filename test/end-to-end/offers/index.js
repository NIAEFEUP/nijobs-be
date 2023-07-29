import Company from "../../../src/models/Company.js";
import Offer from "../../../src/models/Offer.js";
import OfferService from "../../../src/services/offer.js";
import { StatusCodes as HTTPStatus } from "http-status-codes/build/cjs/status-codes.js";
import { ErrorTypes } from "../../../src/api/middleware/errorHandler.js";
import ValidationReasons from "../../../src/api/middleware/validators/validationReasons.js";
import base64url from "base64url";
import { DAY_TO_MS } from "../../utils/TimeConstants.js";
import withGodToken from "../../utils/GodToken.js";
import CompanyApplication from "../../../src/models/CompanyApplication.js";
import Account from "../../../src/models/Account.js";
import hash from "../../../src/lib/passwordHashing.js";

describe("Using already created offer(s)", () => {
    const generateTestOffer = (params) => ({
        title: "Test Offer",
        publishDate: (new Date(Date.now())).toISOString(),
        publishEndDate: (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
        description: "For Testing Purposes",
        contacts: ["geral@niaefeup.pt", "229417766"],
        jobMinDuration: 1,
        jobMaxDuration: 6,
        jobType: "SUMMER INTERNSHIP",
        fields: ["DEVOPS", "BACKEND", "OTHER"],
        technologies: ["React", "CSS"],
        location: "Testing Street, Test City, 123",
        isHidden: false,
        isArchived: false,
        requirements: ["The candidate must be tested", "Fluent in testJS"],
        vacancies: 2,
        ...params,
    });

    const test_agent = agent();

    const test_user_admin = {
        email: "admin@email.com",
        password: "password123",
    };

    const test_user_company = {
        email: "company@email.com",
        password: "password123",
    };

    const approved_test_user_company = {
        email: "approvedCompany@email.com",
        password: "password123",
    };

    let test_company;

    let approved_test_company;

    let test_offer;

    const testPublishDate = "2019-11-22T00:00:00.000Z";

    const testPublishEndDate = "2019-11-28T00:00:00.000Z";


    const RealDateNow = Date.now;
    const mockCurrentDate = new Date("2019-11-23");


    beforeAll(async () => {
        await Company.deleteMany({});
        await CompanyApplication.deleteMany({});

        await CompanyApplication.create({
            email: test_user_company.email,
            password: test_user_company.password,
            companyName: "test verified company",
            motivation: "I want people for job :)",
            isVerified: true,
            submittedAt: Date.now()
        });

        await CompanyApplication.create({
            email: approved_test_user_company.email,
            password: approved_test_user_company.password,
            companyName: "approved test company",
            motivation: "I want people for job :)",
            isVerified: true,
            submittedAt: Date.now() - 1,
            approvedAt: Date.now()
        });

        test_company = await Company.create({
            name: "test company",
            bio: "a bio",
            contacts: ["a contact"],
            hasFinishedRegistration: true,
            logo: "http://awebsite.com/alogo.jpg",
        });

        approved_test_company = await Company.create({
            name: "approved test company",
            bio: "a bio",
            contacts: ["a contact"],
            hasFinishedRegistration: true,
            logo: "http://awebsite.com/alogo.jpg",
        });

        await Account.deleteMany({});

        await Account.create({
            email: test_user_admin.email,
            password: await hash(test_user_admin.password),
            isAdmin: true
        });

        await Account.create({
            email: test_user_company.email,
            password: await hash(test_user_company.password),
            company: test_company._id
        });

        await Account.create({
            email: approved_test_user_company.email,
            password: await hash(approved_test_user_company.password),
            company: approved_test_company._id
        });

        test_offer = {
            ...generateTestOffer({
                "publishDate": testPublishDate,
                "publishEndDate": testPublishEndDate
            }),
            owner: test_company._id,
            ownerName: test_company.name,
            ownerLogo: test_company.logo,
            isPending: false
        };

        await Offer.deleteMany({});
        await Offer.create(test_offer);
    });

    afterAll(async () => {
        await Company.deleteMany({});
        await Account.deleteMany({});
        await CompanyApplication.deleteMany({});
        await Offer.deleteMany({});
    });

    beforeEach(() => {
        Date.now = () => mockCurrentDate.getTime();
    });

    afterEach(() => {
        Date.now = RealDateNow;
    });

    describe("queryToken validation", () => {
        test("should fail if queryToken does not contain a valid id", async () => {
            const queryToken = (new OfferService()).encodeQueryToken("123", 5, "publishDate", mockCurrentDate, false, "test", {});

            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
            expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
            expect(res.body.errors[0]).toHaveProperty("location", "query");
        });

        test("should fail if the queryToken's offer does not exist", async () => {
            const queryToken = (new OfferService())
                .encodeQueryToken("5facf0cdb8bc30016ee58952", 5, "publishDate", mockCurrentDate, false, "test", {});
            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
            expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
            expect(res.body.errors[0]).toHaveProperty("location", "query");
        });

        test("should fail if the queryToken's score is not a number", async () => {
            const testOfferId = (await Offer.findOne({}))._id;
            const queryToken = (new OfferService())
                .encodeQueryToken(testOfferId, "hello", "test", "test", false, "test", {});

            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
            expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
            expect(res.body.errors[0]).toHaveProperty("location", "query");
        });

        test("should fail if the queryToken's score is negative", async () => {
            const testOfferId = (await Offer.findOne({}))._id;
            const queryToken = (new OfferService())
                .encodeQueryToken(testOfferId, -5, "publishDate", mockCurrentDate, false, "test", {});

            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
            expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
            expect(res.body.errors[0]).toHaveProperty("location", "query");
        });

        test("should fail if the queryToken's value is present and score is missing", async () => {
            const testOfferId = (await Offer.findOne({}))._id;
            const queryToken = (new OfferService())
                .encodeQueryToken(testOfferId, undefined, "test", "test", false, "test", {});

            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
            expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
            expect(res.body.errors[0]).toHaveProperty("location", "query");
        });

        test("should fail if the queryToken's score is present and value is missing", async () => {
            const testOfferId = (await Offer.findOne({}))._id;
            const queryToken = (new OfferService())
                .encodeQueryToken(testOfferId, 5, "publishDate", mockCurrentDate, false, undefined, {});

            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
            expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
            expect(res.body.errors[0]).toHaveProperty("location", "query");
        });

        test("should fail if the queryToken's publishDate is not a date", async () => {
            const testOfferId = (await Offer.findOne({}))._id;
            const queryToken = base64url.encode(JSON.stringify({
                id: testOfferId, score: 5, sortField: "publishDate", sortValue: "help", sortDescending: true, value: 5
            }));

            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
            expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
            expect(res.body.errors[0]).toHaveProperty("location", "query");
        });

        test("should fail if the queryToken's publishEndDate is not a date", async () => {
            const testOfferId = (await Offer.findOne({}))._id;
            const queryToken = base64url.encode(JSON.stringify({
                id: testOfferId, score: 5, sortField: "publishEndDate", sortValue: "help", sortDescending: true, value: 5
            }));

            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
            expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
            expect(res.body.errors[0]).toHaveProperty("location", "query");
        });

        test("should fail if the queryToken's sortValue is missing", async () => {
            const testOfferId = (await Offer.findOne({}))._id;
            const queryToken = (new OfferService())
                .encodeQueryToken(testOfferId, 5, "test", undefined, true, undefined, {});

            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
            expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
            expect(res.body.errors[0]).toHaveProperty("location", "query");
        });

        test("should fail if the queryToken's sortField is missing", async () => {
            const testOfferId = (await Offer.findOne({}))._id;
            const queryToken = (new OfferService())
                .encodeQueryToken(testOfferId, 5, undefined, "test", true, undefined, {});

            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
            expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
            expect(res.body.errors[0]).toHaveProperty("location", "query");
        });

        test("should fail if the queryToken's sortDescending is missing", async () => {
            const testOfferId = (await Offer.findOne({}))._id;
            const queryToken = (new OfferService())
                .encodeQueryToken(testOfferId, 5, "test", "test", undefined, undefined, {});

            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.UNPROCESSABLE_ENTITY);
            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors");
            expect(res.body.errors[0]).toHaveProperty("msg", ValidationReasons.INVALID_QUERY_TOKEN);
            expect(res.body.errors[0]).toHaveProperty("param", "queryToken");
            expect(res.body.errors[0]).toHaveProperty("location", "query");
        });

        test("should succeed when the queryToken's value and score are missing", async () => {
            const testOfferId = (await Offer.findOne({}))._id;
            const queryToken = (new OfferService())
                .encodeQueryToken(testOfferId, undefined, "publishDate", mockCurrentDate, true, undefined, {});

            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.OK);
        });

        test("should succeed when the queryToken's value is present and score is a valid number", async () => {
            const testOfferId = (await Offer.findOne({}))._id;
            const queryToken = (new OfferService())
                .encodeQueryToken(testOfferId, 5, "test", "test", false, "test", {});

            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.OK);
        });

        test("should succeed when value is present and queryToken's score can be parsed as a number", async () => {
            const testOfferId = (await Offer.findOne({}))._id;
            const queryToken = (new OfferService())
                .encodeQueryToken(testOfferId, "3.5", "test", "test", false, "test", {});

            const res = await request()
                .get("/offers")
                .query({ queryToken });

            expect(res.status).toBe(HTTPStatus.OK);
        });
    });

    describe("Only current offers are returned", () => {

        const expired_test_offer = generateTestOffer({
            "publishDate": (new Date(Date.now() - (2 * DAY_TO_MS))).toISOString(),
            "publishEndDate": (new Date(Date.now() - (DAY_TO_MS))).toISOString()
        });

        const future_test_offer = generateTestOffer({
            "publishDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
            "publishEndDate": (new Date(Date.now() + (2 * DAY_TO_MS))).toISOString()
        });

        beforeAll(async () => {

            [expired_test_offer, future_test_offer]
                .forEach((offer) => {
                    offer.owner = test_company._id;
                    offer.ownerName = test_company.name;
                    offer.ownerLogo = test_company.logo;
                });

            await Offer.create([future_test_offer]);
        });

        test("should provide only current offer info (no pending offers)", async () => {

            await Offer.create({  ...test_offer, isPending: true, title: "Pending offer" });
            const res = await request()
                .get("/offers");

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(1);

            // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anything(), etc)
            const extracted_data = res.body.results.map((elem) => {
                delete elem["_id"];
                delete elem["__v"];
                delete elem["createdAt"];
                delete elem["updatedAt"];
                delete elem["score"];
                delete elem["queryToken"];
                return elem;
            });

            const prepared_test_offer = {
                ...test_offer,
                isHidden: false,
                owner: test_offer.owner.toString(),
            };

            expect(extracted_data).toContainEqual(prepared_test_offer);
        });


        test("should provide only current offer info (no expired or future offers with no value query)", async () => {
            const res = await request()
                .get("/offers");

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(1);

            // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
            const extracted_data = res.body.results.map((elem) => {
                delete elem["_id"];
                delete elem["__v"];
                delete elem["createdAt"];
                delete elem["updatedAt"];
                delete elem["score"];
                delete elem["queryToken"];
                return elem;
            });
            const prepared_test_offer = {
                ...test_offer,
                isHidden: false,
                owner: test_offer.owner.toString(),

            };

            expect(extracted_data).toContainEqual(prepared_test_offer);
        });

        test("should provide only current offer info (no expired or future offers with some value query)", async () => {
            const res = await request()
                .get("/offers")
                .query({
                    value: "test",
                });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(1);
            // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
            const extracted_data = res.body.results.map((elem) => {
                delete elem["_id"];
                delete elem["__v"];
                delete elem["createdAt"];
                delete elem["updatedAt"];
                delete elem["score"];
                delete elem["queryToken"];
                return elem;
            });
            const prepared_test_offer = {
                ...test_offer,
                isHidden: false,
                owner: test_offer.owner.toString()
            };

            expect(extracted_data).toContainEqual(prepared_test_offer);
        });

        describe("When a limit is given", () => {
            beforeAll(async () => {
                // Add 2 more offers
                await Offer.deleteMany({});
                await Offer.create([test_offer, future_test_offer, test_offer, test_offer]);
            });

            test("Only `limit` number of offers are returned", async () => {
                const res = await request()
                    .get("/offers")
                    .query({
                        limit: 2,
                    });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(2);

                // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                const extracted_data = res.body.results.map((elem) => {
                    delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                    delete elem["updatedAt"]; delete elem["queryToken"];
                    return elem;
                });

                const prepared_test_offer = {
                    ...test_offer,
                    isHidden: false,
                    owner: test_offer.owner.toString()
                };

                expect(extracted_data).toContainEqual(prepared_test_offer);
            });
        });

        describe("When queryToken is given", () => {

            beforeAll(async () => {
                // Add another offer
                await Offer.deleteMany({});
                await Offer.create([test_offer, { ...test_offer, jobType: "FULL-TIME" },
                    expired_test_offer, future_test_offer]);
            });

            test("should fetch offers with the id greater than the one provided", async () => {
                const res = await request()
                    .get("/offers")
                    .query({ limit: 1 });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);

                const res2 = await request()
                    .get("/offers")
                    .query({ queryToken: res.body.queryToken });

                expect(res2.status).toBe(HTTPStatus.OK);
                expect(res2.body?.results).toHaveLength(1);

                const offer = res2.body.results[0];
                expect(offer._id).not.toBe(res.body.results[0]._id);
            });

            test("should succeed if there are no more offers after the last one", async () => {
                const res = await request()
                    .get("/offers");

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(2);

                const res2 = await request()
                    .get("/offers")
                    .query({ queryToken: res.body.queryToken });

                expect(res2.status).toBe(HTTPStatus.OK);
                expect(res2.body?.results).toHaveLength(0);
            });

            test("offers are returned according to filters", async () => {
                const res = await request()
                    .get("/offers")
                    .query({
                        publishDate: testPublishDate,
                        publishEndDate: testPublishEndDate,
                        jobType: "FULL-TIME"
                    });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);
                expect(res.body.results[0].jobType).toBe("FULL-TIME");
            });

            test("offers are returned according to filters when using queryToken", async () => {
                const res = await request()
                    .get("/offers")
                    .query({
                        publishDate: testPublishDate,
                        publishEndDate: testPublishEndDate,
                        fields: ["DEVOPS"],
                        limit: 1
                    });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);
                expect(res.body.results[0].fields).toContainEqual("DEVOPS");

                const res2 = await request()
                    .get("/offers")
                    .query({
                        queryToken: res.body.queryToken
                    });

                expect(res2.status).toBe(HTTPStatus.OK);
                expect(res2.body?.results).toHaveLength(1);
                expect(res2.body.results[0].fields).toContainEqual("DEVOPS");

                const res3 = await request()
                    .get("/offers")
                    .query({
                        publishDate: testPublishDate,
                        publishEndDate: testPublishEndDate,
                        jobType: "FULL-TIME"
                    });

                expect(res3.status).toBe(HTTPStatus.OK);
                expect(res3.body?.results).toHaveLength(1);
                expect(res3.body.results[0].jobType).toBe("FULL-TIME");

                const res4 = await request()
                    .get("/offers")
                    .query({
                        queryToken: res3.body.queryToken
                    });

                expect(res4.status).toBe(HTTPStatus.OK);
                expect(res4.body?.results).toHaveLength(0);
            });

            describe("When offers have different publish dates", () => {
                beforeAll(async () => {
                    Date.now = () => mockCurrentDate.getTime();

                    const least_recent_offer = generateTestOffer({
                        "publishDate": (new Date(Date.now() - (2 * DAY_TO_MS))).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                    });

                    const middle_offer1 = generateTestOffer({
                        "publishDate": (new Date(Date.now() - (DAY_TO_MS))).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                    });

                    const most_recent_offer = generateTestOffer({
                        "publishDate": (new Date(Date.now())).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                    });

                    Date.now = RealDateNow;

                    [least_recent_offer, middle_offer1, middle_offer1, most_recent_offer]
                        .forEach((offer) => {
                            offer.owner = test_company._id;
                            offer.ownerName = test_company.name;
                            offer.ownerLogo = test_company.logo;
                        });

                    await Offer.deleteMany({});
                    await Offer.create([least_recent_offer, middle_offer1, middle_offer1, most_recent_offer]);

                    await test_agent
                        .post("/auth/login")
                        .send({
                            email: test_user_company.email,
                            password: test_user_company.password,
                        });
                });

                afterAll(async () => {
                    await test_agent
                        .delete("/auth/login");
                    await Offer.deleteMany({});
                    await Offer.create([test_offer, { ...test_offer, jobType: "FULL-TIME" },
                        expired_test_offer, future_test_offer]);
                });

                test("Offers should be sorted by publishDate in descending order and then by id", async () => {
                    const res = await test_agent
                        .get("/offers");

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body.results).toHaveLength(4);

                    for (let i = 0; i < res.body.results.length - 1; i++) {
                        try {
                            expect((new Date(res.body.results[i].publishDate)).getTime())
                                .toBeGreaterThan((new Date(res.body.results[i + 1].publishDate)).getTime());
                        } catch {
                            expect(res.body.results[i].publishDate)
                                .toBe(res.body.results[i + 1].publishDate);

                            expect(res.body.results[i]._id < res.body.results[i + 1]._id)
                                .toBeTruthy();
                        }
                    }
                });

                test("Should return next most recent offer", async () => {
                    const res1 = await test_agent
                        .get("/offers")
                        .query({
                            limit: 3
                        });

                    expect(res1.status).toBe(HTTPStatus.OK);
                    expect(res1.body.results).toHaveLength(3);

                    const res2 = await test_agent
                        .get("/offers")
                        .query({
                            queryToken: res1.body.queryToken,
                            limit: 1
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body.results).toHaveLength(1);
                    expect((new Date(res2.body.results[0].publishDate)).getTime())
                        .toBeLessThan((new Date(res1.body.results[2].publishDate)).getTime());
                });

                test("Should return next offer that is as recent but with a higher id", async () => {
                    const res1 = await test_agent
                        .get("/offers")
                        .query({
                            limit: 2
                        });

                    expect(res1.status).toBe(HTTPStatus.OK);
                    expect(res1.body.results).toHaveLength(2);

                    const res2 = await test_agent
                        .get("/offers")
                        .query({
                            queryToken: res1.body.queryToken,
                            limit: 1
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body.results).toHaveLength(1);
                    expect(res2.body.results[0]._id > res1.body.results[1]._id)
                        .toBeTruthy();
                });
            });
        });

        describe("When showHidden is active", () => {

            beforeAll(async () => {
                // Add 1 hidden offer
                await Offer.deleteMany({});
                await Offer.create([test_offer, { ...test_offer, isHidden: true }]);

            });

            test("Should not return hidden offers by default", async () => {
                await test_agent
                    .post("/auth/login")
                    .send({
                        email: test_user_company.email,
                        password: test_user_company.password,
                    });

                const res = await test_agent
                    .get("/offers");

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);

                // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                const extracted_data = res.body.results.map((elem) => {
                    delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                    delete elem["updatedAt"]; delete elem["queryToken"];
                    return elem;
                });

                const prepared_test_offer = {
                    ...test_offer,
                    isHidden: false,
                    owner: test_offer.owner.toString()
                };

                expect(extracted_data).toContainEqual(prepared_test_offer);
            });

            test("Only admins can use showHidden", async () => {
                await test_agent
                    .post("/auth/login")
                    .send({
                        email: test_user_company.email,
                        password: test_user_company.password,
                    });

                const res = await test_agent
                    .get("/offers")
                    .query({
                        showHidden: true,
                    });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);

                // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                const extracted_data = res.body.results.map((elem) => {
                    delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                    delete elem["updatedAt"]; delete elem["queryToken"];
                    return elem;
                });

                const prepared_test_offer = {
                    ...test_offer,
                    isHidden: false,
                    owner: test_offer.owner.toString()
                };

                expect(extracted_data).toContainEqual(prepared_test_offer);
            });

            test("Only admins can use showHidden (with admin)", async () => {
                await test_agent
                    .post("/auth/login")
                    .send({
                        email: test_user_admin.email,
                        password: test_user_admin.password,
                    });

                const res = await test_agent
                    .get("/offers")
                    .query({
                        showHidden: true,
                    });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(2);

                // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
                const extracted_data = res.body.results.map((elem) => {
                    delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                    delete elem["updatedAt"]; delete elem["queryToken"];
                    return elem;
                });

                const prepared_test_offer = {
                    ...test_offer,
                    isHidden: false,
                    owner: test_offer.owner.toString()
                };

                expect(extracted_data).toContainEqual(prepared_test_offer);
            });
        });

        describe("showAdminReason", () => {

            beforeAll(async () => {
                await Offer.deleteMany({});
                const test_offers = [];

                for (let i = 0; i < 5; i++)
                    test_offers.push(
                        {
                            ...test_offer,
                            isHidden: true,
                            hiddenReason: "ADMIN_REQUEST",
                            adminReason: "my_reason"
                        });

                await Offer.create(test_offers);
            });

            afterEach(async () => {
                await test_agent.del("/auth/login");
            });

            test("should return adminReason if logged as admin", async () => {

                await test_agent
                    .post("/auth/login")
                    .send(test_user_admin)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .get("/offers")
                    .query({
                        showHidden: true,
                    });

                expect(res.status).toBe(HTTPStatus.OK);

                const extracted_data = res.body.results.map((elem) => elem["adminReason"]);

                const expected_data = ["my_reason", "my_reason", "my_reason", "my_reason", "my_reason"];

                expect(extracted_data).toEqual(expected_data);
            });

            test("should return adminReason if god token is sent", async () => {

                const res = await test_agent
                    .get("/offers")
                    .query({
                        showHidden: true,
                    })
                    .send(withGodToken());

                expect(res.status).toBe(HTTPStatus.OK);

                const extracted_data = res.body.results.map((elem) => elem["adminReason"]);

                const expected_data = ["my_reason", "my_reason", "my_reason", "my_reason", "my_reason"];

                expect(extracted_data).toEqual(expected_data);
            });

            test("should not return adminReason if logged as company", async () => {

                await test_agent
                    .post("/auth/login")
                    .send(test_user_company)
                    .expect(HTTPStatus.OK);

                const res = await test_agent
                    .get("/offers");

                expect(res.status).toBe(HTTPStatus.OK);

                const extracted_data = res.body.results.map((elem) => elem["adminReason"]);

                const expected_data = [];

                expect(extracted_data).toEqual(expected_data);

            });

            test("should not return adminReason if not logged in", async () => {

                const res = await test_agent
                    .get("/offers");

                expect(res.status).toBe(HTTPStatus.OK);

                const extracted_data = res.body.results.map((elem) => elem["adminReason"]);

                const expected_data = [];

                expect(extracted_data).toEqual(expected_data);

            });
        });
    });

    describe("Full text search", () => {

        let portoFrontend;
        let portoBackend;
        let lisboaBackend;
        let niaefeupOffer;

        beforeAll(async () => {
            portoFrontend = {
                ...test_offer,
                title: "This offer is from Porto",
                location: "Porto",
                jobType: "FULL-TIME",
                fields: ["FRONTEND", "OTHER"],
                jobMinDuration: 3,
                jobMaxDuration: 6
            };
            portoBackend = {
                ...test_offer,
                location: "Porto",
                fields: ["BACKEND", "OTHER"],
                jobMinDuration: 2,
                jobMaxDuration: 4
            };
            lisboaBackend = {
                ...test_offer,
                location: "Lisboa",
                fields: ["BACKEND", "DEVOPS"]
            };
            niaefeupOffer = {
                ...test_offer,
                location: "FEUP",
                fields: ["BLOCKCHAIN", "OTHER"],
                ownerName: "NIAEFEUP"
            };
            await Offer.deleteMany({});
            await Offer.create([portoBackend, portoFrontend, lisboaBackend, niaefeupOffer]);
        });

        test("should return porto offers", async () => {

            const res = await request()
                .get("/offers")
                .query({
                    value: "porto"
                });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);

            // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
            const extracted_data = res.body.results.map((elem) => {
                delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
                return elem;
            });

            // eslint-disable-next-line no-unused-vars
            const expected_offers = [portoBackend, portoFrontend].map(({ owner, ...offer }) => ({
                ...offer,
                isHidden: false,
                owner: owner.toString()
            }));

            expected_offers.forEach((expected) => {
                expect(extracted_data).toContainEqual(expected);
            });
        });

        test("should return niaefeup (company) offers", async () => {

            const res = await request()
                .get("/offers")
                .query({
                    value: "niaefeup"
                });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(1);

            // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
            const extracted_data = res.body.results.map((elem) => {
                delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
                return elem;
            });

            const prepared_test_offer = {
                ...niaefeupOffer,
                isHidden: false,
                owner: niaefeupOffer.owner.toString()
            };

            expect(extracted_data).toContainEqual(prepared_test_offer);
        });

        test("should return porto offers in order", async () => {

            const res = await request()
                .get("/offers")
                .query({
                    value: "porto frontend"
                });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);

            // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
            const extracted_data = res.body.results.map((elem) => {
                delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
                return elem;
            });

            // eslint-disable-next-line no-unused-vars
            const expected_offers = [portoFrontend, portoBackend].map(({ owner, ...offer }) => ({
                ...offer,
                isHidden: false,
                owner: owner.toString()
            }));

            expected_offers.forEach((expected, i) => {
                expect(extracted_data[i]).toEqual(expected);
            });
        });

        test("should return porto offers for FULL-TIME", async () => {

            const res = await request()
                .get("/offers")
                .query({
                    value: "porto",
                    jobType: "FULL-TIME"
                });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(1);

            // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
            const extracted_data = res.body.results.map((elem) => {
                delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
                return elem;
            });

            const prepared_test_offer = {
                ...portoFrontend,
                isHidden: false,
                owner: portoFrontend.owner.toString()
            };

            expect(extracted_data).toContainEqual(prepared_test_offer);
        });

        test("should return porto offers with React", async () => {

            const res = await request()
                .get("/offers")
                .query({
                    value: "porto",
                    technologies: ["React"]
                });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);

            // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
            const extracted_data = res.body.results.map((elem) => {
                delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
                return elem;
            });

            // eslint-disable-next-line no-unused-vars
            const expected_offers = [portoFrontend, portoBackend].map(({ owner, ...offer }) => ({
                ...offer,
                isHidden: false,
                owner: owner.toString()
            }));

            expected_offers.forEach((expected) => {
                expect(extracted_data).toContainEqual(expected);
            });
        });

        test("should return offers with DEVOPS", async () => {

            const res = await request()
                .get("/offers")
                .query({
                    fields: ["DEVOPS"]
                });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(1);

            // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
            const extracted_data = res.body.results.map((elem) => {
                delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
                return elem;
            });

            const prepared_test_offer = {
                ...lisboaBackend,
                isHidden: false,
                owner: lisboaBackend.owner.toString()
            };

            expect(extracted_data).toContainEqual(prepared_test_offer);
        });

        test("should return porto offers with min duration of 2", async () => {

            const res = await request()
                .get("/offers")
                .query({
                    value: "porto",
                    jobMinDuration: 2
                });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);

            // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
            const extracted_data = res.body.results.map((elem) => {
                delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
                return elem;
            });

            // eslint-disable-next-line no-unused-vars
            const expected_offers = [portoFrontend, portoBackend].map(({ owner, ...offer }) => ({
                ...offer,
                isHidden: false,
                owner: owner.toString()
            }));

            expected_offers.forEach((expected) => {
                expect(extracted_data).toContainEqual(expected);
            });
        });

        test("should return porto offers with min duration of 2 and max duration of 4", async () => {

            // This test should include the 3-6 offer as well, since [3,6] intersects [2,4]

            const res = await request()
                .get("/offers")
                .query({
                    value: "porto",
                    jobMinDuration: 2,
                    jobMaxDuration: 4
                });
            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);

            // Necessary because jest matchers appear to not be working (expect.any(Number), expect.anthing(), etc)
            const extracted_data = res.body.results.map((elem) => {
                delete elem["_id"]; delete elem["__v"]; delete elem["createdAt"];
                delete elem["updatedAt"]; delete elem["score"]; delete elem["queryToken"];
                return elem;
            });

            // eslint-disable-next-line no-unused-vars
            const expected_offers = [portoBackend, portoFrontend].map(({ owner, ...offer }) => ({
                ...offer,
                isHidden: false,
                owner: owner.toString()
            }));

            expected_offers.forEach((expected) => {
                expect(extracted_data).toContainEqual(expected);
            });
        });

        describe("When queryToken and value are given", () => {

            test("should return next matching offer with lower score", async () => {
                const res = await request()
                    .get("/offers")
                    .query({
                        value: "porto",
                        limit: 1
                    });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);
                expect(res.body.results[0].title).toEqual(portoFrontend.title);

                const res2 = await request()
                    .get("/offers")
                    .query({
                        value: "porto",
                        queryToken: res.body.queryToken
                    });

                expect(res2.status).toBe(HTTPStatus.OK);
                expect(res2.body?.results).toHaveLength(1);
                expect(res2.body.results[0].title).toEqual(portoBackend.title);
            });

            test("should return next matching offer with the same score", async () => {
                const res = await request()
                    .get("/offers")
                    .query({
                        value: "backend",
                        limit: 1
                    });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);

                const res2 = await request()
                    .get("/offers")
                    .query({
                        value: "backend",
                        queryToken: res.body.queryToken
                    });

                expect(res2.status).toBe(HTTPStatus.OK);
                expect(res2.body?.results).toHaveLength(1);
            });

            describe("With offers with different publish dates", () => {
                beforeAll(async () => {
                    Date.now = () => mockCurrentDate.getTime();

                    const bestScoreMostRecent = {
                        ...test_offer,
                        title: "This offer is from Porto",
                        "publishDate": (new Date(Date.now() - (DAY_TO_MS))).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                    };

                    const bestScoreLeastRecent = {
                        ...test_offer,
                        title: "This offer is from Porto",
                        "publishDate": (new Date(Date.now() - (2 * DAY_TO_MS))).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                    };

                    const worstScore = {
                        ...test_offer,
                        title: "This offer is from Braga",
                        location: "Porto",
                        "publishDate": (new Date(Date.now() - (DAY_TO_MS))).toISOString(),
                        "publishEndDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString()
                    };

                    Date.now = RealDateNow;

                    await Offer.deleteMany({});
                    await Offer.create([bestScoreMostRecent, bestScoreMostRecent, bestScoreLeastRecent, worstScore, worstScore]);

                    await test_agent
                        .post("/auth/login")
                        .send({
                            email: test_user_company.email,
                            password: test_user_company.password,
                        });
                });

                afterAll(async () => {
                    await Offer.deleteMany({});
                    await Offer.create([portoBackend, portoFrontend, lisboaBackend, niaefeupOffer]);
                    await test_agent
                        .delete("/auth/login");
                });

                test("Offers should be ordered by score, publishDate and id in that order", async () => {
                    const res = await test_agent
                        .get("/offers")
                        .query({
                            value: "Porto"
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body.results).toHaveLength(5);

                    for (let i = 0; i < res.body.results.length - 1; i++) {
                        try {
                            expect(Number(res.body.results[i].score))
                                .toBeGreaterThan(Number(res.body.results[i + 1].score));
                        } catch {
                            try {
                                expect(res.body.results[i].score)
                                    .toBe(res.body.results[i + 1].score);
                                expect((new Date(res.body.results[i].publishDate)).getTime())
                                    .toBeGreaterThan((new Date(res.body.results[i + 1].publishDate)).getTime());
                            } catch {
                                expect(res.body.results[i].score)
                                    .toBe(res.body.results[i + 1].score);
                                expect(res.body.results[i].publishDate)
                                    .toBe(res.body.results[i + 1].publishDate);

                                expect(res.body.results[i]._id < res.body.results[i + 1]._id)
                                    .toBeTruthy();
                            }
                        }
                    }
                });

                test("Should return next offer with less score", async () => {
                    const res1 = await test_agent
                        .get("/offers")
                        .query({
                            value: "Porto",
                            limit: 3
                        });

                    expect(res1.status).toBe(HTTPStatus.OK);
                    expect(res1.body.results).toHaveLength(3);

                    const res2 = await test_agent
                        .get("/offers")
                        .query({
                            queryToken: res1.body.queryToken,
                            limit: 1
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body.results).toHaveLength(1);
                    expect(Number(res2.body.results[0].score))
                        .toBeLessThan(Number(res1.body.results[2].score));
                });


                test("Should return next offer with same score but least recent", async () => {
                    const res1 = await test_agent
                        .get("/offers")
                        .query({
                            value: "Porto",
                            limit: 2
                        });

                    expect(res1.status).toBe(HTTPStatus.OK);
                    expect(res1.body.results).toHaveLength(2);

                    const res2 = await test_agent
                        .get("/offers")
                        .query({
                            queryToken: res1.body.queryToken,
                            limit: 1
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body.results).toHaveLength(1);
                    expect((new Date(res2.body.results[0].publishDate)).getTime())
                        .toBeLessThan((new Date(res1.body.results[1].publishDate)).getTime());
                });

                test("Should return next offer with same score and publishDate but higher id", async () => {
                    const res1 = await test_agent
                        .get("/offers")
                        .query({
                            value: "Porto",
                            limit: 4
                        });

                    expect(res1.status).toBe(HTTPStatus.OK);
                    expect(res1.body.results).toHaveLength(4);

                    const res2 = await test_agent
                        .get("/offers")
                        .query({
                            queryToken: res1.body.queryToken,
                            limit: 1
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body.results).toHaveLength(1);

                    expect(res2.body.results[0]._id > res1.body.results[3]._id)
                        .toBeTruthy();
                });

                test("Should succeed if there are no more offers after the last one", async () => {
                    const res1 = await test_agent
                        .get("/offers")
                        .query({
                            value: "Porto"
                        });

                    expect(res1.status).toBe(HTTPStatus.OK);
                    expect(res1.body.results).toHaveLength(5);

                    const res2 = await test_agent
                        .get("/offers")
                        .query({
                            queryToken: res1.body.queryToken
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body.results).toHaveLength(0);
                });
            });

            describe("With not current offers", () => {

                const expired_test_offer = generateTestOffer({
                    "publishDate": (new Date(Date.now() - (2 * DAY_TO_MS))).toISOString(),
                    "publishEndDate": (new Date(Date.now() - (DAY_TO_MS))).toISOString()
                });
                const future_test_offer = generateTestOffer({
                    "publishDate": (new Date(Date.now() + (DAY_TO_MS))).toISOString(),
                    "publishEndDate": (new Date(Date.now() + (2 * DAY_TO_MS))).toISOString()
                });

                beforeAll(async () => {

                    [future_test_offer, expired_test_offer]
                        .forEach((offer) => {
                            offer.owner = test_company._id;
                            offer.ownerName = test_company.name;
                            offer.ownerLogo = test_company.logo;
                        });

                    await Offer.create([expired_test_offer, future_test_offer]);
                });

                afterAll(async () => {
                    await Offer.deleteOne(future_test_offer);
                    await Offer.deleteOne(expired_test_offer);
                });

                test("should provide only current offers", async () => {
                    const res = await request()
                        .get("/offers")
                        .query({
                            value: "porto",
                            limit: 1
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body?.results).toHaveLength(1);

                    const res2 = await request()
                        .get("/offers")
                        .query({
                            value: "porto",
                            queryToken: res.body.queryToken
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body?.results).toHaveLength(1);

                    res2.body.results.forEach((offer) => {
                        expect(offer.publishDate <= new Date(Date.now()).toISOString()).toBeTruthy();
                        expect(offer.publishEndDate >= new Date(Date.now()).toISOString()).toBeTruthy();
                    });
                });
            });

            describe("When queryToken and value are provided and showHidden is active", () => {

                beforeAll(async () => {
                    await Offer.create({
                        ...portoFrontend,
                        isHidden: true,
                        title: "This offer is hidden"
                    });
                });

                afterAll(async () => {
                    await Offer.deleteOne({ isHidden: true });
                });

                test("should not return hidden offers by default", async () => {
                    const res = await request()
                        .get("/offers")
                        .query({
                            value: "porto",
                            limit: 1
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body?.results).toHaveLength(1);

                    const res2 = await request()
                        .get("/offers")
                        .query({
                            value: "porto",
                            queryToken: res.body.queryToken
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body?.results).toHaveLength(1);

                    res2.body.results.forEach((offer) => {
                        expect(offer.isHidden).toBeFalsy();
                    });
                });

                test("companies should not see their hidden offers", async () => {
                    await test_agent
                        .post("/auth/login")
                        .send(test_user_company)
                        .expect(HTTPStatus.OK);

                    const res = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            showHidden: true,
                            limit: 1
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body?.results).toHaveLength(1);

                    const res2 = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            queryToken: res.body.queryToken
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body?.results).toHaveLength(1);

                    res2.body.results.forEach((offer) => {
                        expect(offer.isHidden).toBeFalsy();
                    });
                });

                test("admins should see hidden offers", async () => {
                    await test_agent
                        .post("/auth/login")
                        .send(test_user_admin)
                        .expect(HTTPStatus.OK);

                    const res = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            showHidden: true,
                            limit: 1
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body?.results).toHaveLength(1);

                    const res2 = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            showHidden: true,
                            queryToken: res.body.queryToken
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body?.results).toHaveLength(2);
                });

                test("should see hidden offers if god token is sent", async () => {
                    const res = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            showHidden: true,
                            limit: 1
                        })
                        .send(withGodToken());

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body?.results).toHaveLength(1);

                    const res2 = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            showHidden: true,
                            queryToken: res.body.queryToken
                        })
                        .send(withGodToken());

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body?.results).toHaveLength(2);
                });
            });

            describe("When queryToken and value are provided and adminReason is set", () => {
                beforeAll(async () => {
                    await Offer.create({
                        ...portoFrontend,
                        title: "This offer was hidden by an admin",
                        isHidden: true,
                        hiddenReason: "ADMIN_REQUEST",
                        adminReason: "test_reason"
                    });
                });

                afterAll(async () => {
                    await Offer.deleteOne({ isHidden: true });
                });

                test("should return adminReason if logged in as admin", async () => {
                    await test_agent
                        .post("/auth/login")
                        .send(test_user_admin)
                        .expect(HTTPStatus.OK);

                    const res = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            showHidden: true,
                            limit: 1
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body?.results).toHaveLength(1);

                    const res2 = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            showHidden: true,
                            queryToken: res.body.queryToken
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body?.results).toHaveLength(2);

                    res2.body.results.filter((offer) => offer.isHidden).forEach((offer) => {
                        expect(offer.hiddenReason).toBe("ADMIN_REQUEST");
                        expect(offer.adminReason).toBe("test_reason");
                    });
                });

                test("should return adminReason if god token is sent", async () => {
                    const res = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            showHidden: true,
                            limit: 1
                        })
                        .send(withGodToken());

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body?.results).toHaveLength(1);

                    const res2 = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            showHidden: true,
                            queryToken: res.body.queryToken
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body?.results).toHaveLength(2);

                    res2.body.results.filter((offer) => offer.isHidden).forEach((offer) => {
                        expect(offer.hiddenReason).toBe("ADMIN_REQUEST");
                        expect(offer.adminReason).toBe("test_reason");
                    });
                });

                test("companies should not see admin reason for their own offers", async () => {
                    await test_agent
                        .post("/auth/login")
                        .send(test_user_company)
                        .expect(HTTPStatus.OK);

                    const res = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            showHidden: true,
                            limit: 1
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body?.results).toHaveLength(1);
                    expect(res.body.results[0].adminReason).toBeUndefined();

                    const res2 = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            showHidden: true,
                            queryToken: res.body.queryToken
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body?.results).toHaveLength(1);
                    res2.body.results.forEach((offer) => {
                        expect(offer.adminReason).toBeUndefined();
                    });
                });

                test("should not return admin reason if not logged in", async () => {
                    const res = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            showHidden: true,
                            limit: 1
                        });

                    expect(res.status).toBe(HTTPStatus.OK);
                    expect(res.body?.results).toHaveLength(1);
                    expect(res.body.results[0].adminReason).toBeUndefined();

                    const res2 = await test_agent
                        .get("/offers")
                        .query({
                            value: "porto",
                            showHidden: true,
                            queryToken: res.body.queryToken
                        });

                    expect(res2.status).toBe(HTTPStatus.OK);
                    expect(res2.body?.results).toHaveLength(1);
                    res2.body.results.forEach((offer) => {
                        expect(offer.adminReason).toBeUndefined();
                    });
                });
            });
        });
    });

    describe("Offer requirements", () => {

        beforeAll(async () => {
            await Offer.deleteMany();
            await Offer.create(test_offer);
        });

        test("should return an array of requirements", async () => {

            const res = await request()
                .get("/offers");

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(1);
            expect(res.body.results[0].requirements).toEqual(test_offer.requirements);
        });
    });

    describe("Offer sorting", () => {
        beforeAll(async () => {
            await Offer.deleteMany();
            await Offer.create(test_offer);

            await Offer.create({
                ...test_offer,
                title: "Amazing offer",
                publishDate: "2019-11-23T00:00:00.000Z",
                publishEndDate: "2019-11-29T00:00:00.000Z",
                description: "Ability to have an incredible job",
                jobType: "OTHER",
                location: "Aveiro",
                vacancies: 1,
                ownerName: "Awesome Company",
            });
        });

        afterAll(async () => {
            await Offer.deleteMany({});
        });

        test("should sort by publishDate by default", async () => {
            const res = await request()
                .get("/offers");

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe("Amazing offer");
            expect(res.body.results[1].title).toBe(test_offer.title);
        });

        test("should sort by title ascending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "title" });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe("Amazing offer");
            expect(res.body.results[1].title).toBe(test_offer.title);
        });

        test("should sort by title descending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "title", descending: true });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe(test_offer.title);
            expect(res.body.results[1].title).toBe("Amazing offer");
        });

        test("should sort by publishDate ascending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "publishDate" });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe(test_offer.title);
            expect(res.body.results[1].title).toBe("Amazing offer");
        });

        test("should sort by publishDate descending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "publishDate", descending: true });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe("Amazing offer");
            expect(res.body.results[1].title).toBe(test_offer.title);
        });

        test("should sort by publishEndDate ascending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "publishEndDate" });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe(test_offer.title);
            expect(res.body.results[1].title).toBe("Amazing offer");
        });

        test("should sort by publishEndDate descending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "publishEndDate", descending: true });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe("Amazing offer");
            expect(res.body.results[1].title).toBe(test_offer.title);
        });

        test("should sort by description ascending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "description" });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe("Amazing offer");
            expect(res.body.results[1].title).toBe(test_offer.title);
        });

        test("should sort by description descending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "description", descending: true });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe(test_offer.title);
            expect(res.body.results[1].title).toBe("Amazing offer");
        });

        test("should sort by jobType ascending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "jobType" });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe("Amazing offer");
            expect(res.body.results[1].title).toBe(test_offer.title);
        });

        test("should sort by jobType descending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "jobType", descending: true });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe(test_offer.title);
            expect(res.body.results[1].title).toBe("Amazing offer");
        });

        test("should sort by location ascending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "location" });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe("Amazing offer");
            expect(res.body.results[1].title).toBe(test_offer.title);
        });

        test("should sort by location descending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "location", descending: true });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe(test_offer.title);
            expect(res.body.results[1].title).toBe("Amazing offer");
        });

        test("should sort by vacancies ascending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "vacancies" });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe("Amazing offer");
            expect(res.body.results[1].title).toBe(test_offer.title);
        });

        test("should sort by vacancies descending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "vacancies", descending: true });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe(test_offer.title);
            expect(res.body.results[1].title).toBe("Amazing offer");
        });

        test("should sort by ownerName ascending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "ownerName" });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe("Amazing offer");
            expect(res.body.results[1].title).toBe(test_offer.title);
        });

        test("should sort by ownerName descending", async () => {
            const res = await request()
                .get("/offers")
                .query({ sortBy: "ownerName", descending: true });

            expect(res.status).toBe(HTTPStatus.OK);
            expect(res.body?.results).toHaveLength(2);
            expect(res.body.results[0].title).toBe(test_offer.title);
            expect(res.body.results[1].title).toBe("Amazing offer");
        });

        describe("Using pagination", () => {
            beforeAll(async () => {
                await Offer.deleteMany();
                await Offer.create(test_offer);

                await Offer.create({
                    ...test_offer,
                    title: "Amazing offer",
                    publishDate: "2019-11-23T00:00:00.000Z",
                    publishEndDate: "2019-11-29T00:00:00.000Z",
                    description: "Ability to have an incredible job",
                    jobType: "OTHER",
                    location: "Aveiro",
                    ownerName: "Awesome Company",
                    vacancies: 3,
                });
            });

            afterAll(async () => {
                await Offer.deleteMany({});
            });

            test("should sort by title in multiple pages", async () => {
                const res = await request()
                    .get("/offers")
                    .query({ sortBy: "title", limit: 1 });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);
                expect(res.body.results[0].title).toBe("Amazing offer");

                const res2 = await request()
                    .get("/offers")
                    .query({ limit: 1, queryToken: res.body.queryToken });

                expect(res2.status).toBe(HTTPStatus.OK);
                expect(res2.body?.results).toHaveLength(1);
                expect(res2.body.results[0].title).toBe(test_offer.title);
            });

            test("should sort by publishEndDate in multiple pages", async () => {
                const res = await request()
                    .get("/offers")
                    .query({ sortBy: "publishEndDate", limit: 1 });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);
                expect(res.body.results[0].title).toBe(test_offer.title);

                const res2 = await request()
                    .get("/offers")
                    .query({ limit: 1, queryToken: res.body.queryToken });

                expect(res2.status).toBe(HTTPStatus.OK);
                expect(res2.body?.results).toHaveLength(1);
                expect(res2.body.results[0].title).toBe("Amazing offer");
            });

            test("should sort by description in multiple pages", async () => {
                const res = await request()
                    .get("/offers")
                    .query({ sortBy: "description", limit: 1 });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);
                expect(res.body.results[0].title).toBe("Amazing offer");

                const res2 = await request()
                    .get("/offers")
                    .query({ limit: 1, queryToken: res.body.queryToken });

                expect(res2.status).toBe(HTTPStatus.OK);
                expect(res2.body?.results).toHaveLength(1);
                expect(res2.body.results[0].title).toBe(test_offer.title);
            });

            test("should sort by jobType in multiple pages", async () => {
                const res = await request()
                    .get("/offers")
                    .query({ sortBy: "jobType", limit: 1 });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);
                expect(res.body.results[0].title).toBe("Amazing offer");

                const res2 = await request()
                    .get("/offers")
                    .query({ limit: 1, queryToken: res.body.queryToken });

                expect(res2.status).toBe(HTTPStatus.OK);
                expect(res2.body?.results).toHaveLength(1);
                expect(res2.body.results[0].title).toBe(test_offer.title);
            });

            test("should sort by location in multiple pages", async () => {
                const res = await request()
                    .get("/offers")
                    .query({ sortBy: "location", limit: 1 });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);
                expect(res.body.results[0].title).toBe("Amazing offer");

                const res2 = await request()
                    .get("/offers")
                    .query({ limit: 1, queryToken: res.body.queryToken });

                expect(res2.status).toBe(HTTPStatus.OK);
                expect(res2.body?.results).toHaveLength(1);
                expect(res2.body.results[0].title).toBe(test_offer.title);
            });

            test("should sort by vacancies in multiple pages", async () => {
                const res = await request()
                    .get("/offers")
                    .query({ sortBy: "vacancies", limit: 1 });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);
                expect(res.body.results[0].title).toBe(test_offer.title);

                const res2 = await request()
                    .get("/offers")
                    .query({ limit: 1, queryToken: res.body.queryToken });

                expect(res2.status).toBe(HTTPStatus.OK);
                expect(res2.body?.results).toHaveLength(1);
                expect(res2.body.results[0].title).toBe("Amazing offer");
            });

            test("should sort by ownerName in multiple pages", async () => {
                const res = await request()
                    .get("/offers")
                    .query({ sortBy: "ownerName", limit: 1 });

                expect(res.status).toBe(HTTPStatus.OK);
                expect(res.body?.results).toHaveLength(1);
                expect(res.body.results[0].title).toBe("Amazing offer");

                const res2 = await request()
                    .get("/offers")
                    .query({ limit: 1, queryToken: res.body.queryToken });

                expect(res2.status).toBe(HTTPStatus.OK);
                expect(res2.body?.results).toHaveLength(1);
                expect(res2.body.results[0].title).toBe(test_offer.title);
            });
        });
    });
});
