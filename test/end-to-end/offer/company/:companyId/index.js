import { StatusCodes } from "http-status-codes";
import ValidationReasons from "../../../../../src/api/middleware/validators/validationReasons";
import Offer from "../../../../../src/models/Offer";
// import { DAY_TO_MS } from "../../../../utils/TimeConstants";
import Company from "../../../../../src/models/Company";
import Account from "../../../../../src/models/Account";
import { ErrorTypes } from "../../../../../src/api/middleware/errorHandler";

describe("GET /offers/company/:companyId", () => {

    /* const generateTestOffer = (params) => ({
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
    }); */

    beforeAll(async () => {
        await Offer.deleteMany({});
        await Company.deleteMany({});
        await Account.deleteMany({});
    });

    afterAll(async () => {
        await Offer.deleteMany({});
        await Company.deleteMany({});
        await Account.deleteMany({});
    });

    describe("Id Validation", () => {
        test("should fail if requested an invalid companyId", async () => {
            const res = await request()
                .get("/offers/company/123")
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    "param": "companyId",
                    "msg": ValidationReasons.OBJECT_ID,
                })
            ]));
        });

        test("should fail if there isn't a company with that id", async () => {
            const missingCompanyId = "60ddb0bb2849830020883f91";

            const res = await request()
                .get(`/offers/company/${missingCompanyId}`)
                .expect(StatusCodes.UNPROCESSABLE_ENTITY);

            expect(res.body).toHaveProperty("error_code", ErrorTypes.VALIDATION_ERROR);
            expect(res.body).toHaveProperty("errors", expect.arrayContaining([
                expect.objectContaining({
                    "param": "companyId",
                    "msg": ValidationReasons.COMPANY_NOT_FOUND(missingCompanyId),
                })
            ]));
        });
    });

    describe("Without auth", () => { });

    describe("With auth", () => { });

    /*
    describe("Get offer by companyId", () => {
        const test_offers = [{}, {}, {}, {}];
        const test_agent = agent();

        beforeAll(async () => {
            await Offer.deleteMany({});

            const createOffer = async (offer) => {
                const { _id, owner, ownerName, ownerLogo } = await Offer.create({
                    ...offer,
                    owner: test_company._id.toString(),
                    ownerName: test_company.name,
                    ownerLogo: test_company.logo,
                });
                return {
                    ...offer,
                    owner: owner.toString(),
                    ownerName,
                    ownerLogo,
                    _id: _id.toString()
                };
            };

            (await Promise.all(test_offers
                .map((_, i) => createOffer({ ...generateTestOffer(), isHidden: i === 2 }))))
                .forEach((elem, i) => {
                    test_offers[i] = elem;
                });
        });

        test("should return hidden company offers as company", async () => {
            // Login wiht test_user_company
            await test_agent
                .post("/auth/login")
                .send(test_user_company)
                .expect(StatusCodes.OK);

            const res = await test_agent.get(`/offers/company/${test_company._id}`);
            expect(res.status).toBe(StatusCodes.OK);

            const extractedData = res.body;
            expect(extractedData.map((offer) => offer._id).sort())
                .toMatchObject(
                    test_offers.map((offer) => offer._id).sort()
                );

            // Logout
            await test_agent
                .del("/auth/login")
                .expect(StatusCodes.OK);
        });

        test("should return non-hidden offers", async () => {
            const res = await test_agent.get(`/offers/company/${test_company._id}`);
            expect(res.status).toBe(StatusCodes.OK);

            const extractedData = res.body;
            expect(extractedData.map((offer) => offer._id).sort())
                .toMatchObject(
                    test_offers.filter((offer) => offer.isHidden === false).map((offer) => offer._id).sort()
                );
        });

        test("should return non-hidden offers, even if target owner is set", async () => {
            const res = await test_agent
                .get(`/offers/company/${test_company._id}`)
                .send({
                    owner: test_company._id
                });

            expect(res.status).toBe(StatusCodes.OK);

            const extractedData = res.body;
            expect(extractedData.map((offer) => offer._id).sort())
                .toMatchObject(
                    test_offers.filter((offer) => offer.isHidden === false).map((offer) => offer._id).sort()
                );
        });

        test("should return hidden company offers as admin", async () => {
            // Login with test_user_company
            await test_agent
                .post("/auth/login")
                .send(test_user_admin)
                .expect(StatusCodes.OK);

            const res = await test_agent.get(`/offers/company/${test_company._id}`);
            expect(res.status).toBe(StatusCodes.OK);

            const extractedData = res.body;
            expect(extractedData.map((offer) => offer._id).sort())
                .toMatchObject(
                    test_offers.map((offer) => offer._id).sort()
                );

            // Logout
            await test_agent
                .del("/auth/login")
                .expect(StatusCodes.OK);
        });

        test("should return hidden company offers with god token", async () => {
            // Send request with god token
            const res = await test_agent
                .get(`/offers/company/${test_company._id}`)
                .send(withGodToken());

            expect(res.status).toBe(StatusCodes.OK);

            const extractedData = res.body;
            expect(extractedData.map((offer) => offer._id).sort())
                .toMatchObject(
                    test_offers.map((offer) => offer._id).sort()
                );
        });
    });
    */
});
