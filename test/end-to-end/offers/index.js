import Company from "../../../src/models/Company.js";
import Offer from "../../../src/models/Offer.js";
import { StatusCodes as HTTPStatus } from "http-status-codes/build/cjs/status-codes.js";
import { DAY_TO_MS } from "../../utils/TimeConstants.js";
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
    });
});
