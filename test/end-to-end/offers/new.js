import { DAY_TO_MS } from "../../utils/TimeConstants.js";
import Company from "../../../src/models/Company.js";
import Account from "../../../src/models/Account.js";
import hash from "../../../src/lib/passwordHashing.js";
import { StatusCodes as HTTPStatus } from "http-status-codes/build/cjs/status-codes.js";
import withGodToken from "../../utils/GodToken.js";
import Offer from "../../../src/models/Offer.js";
import CompanyApplication from "../../../src/models/CompanyApplication.js";

describe("POST /offers/new", () => {
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

    let test_company, approved_test_company;


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

    beforeAll(async () => {

        await Company.deleteMany({});

        await Account.deleteMany({});

        await CompanyApplication.deleteMany({});

        test_company = await Company.create({
            name: "test company",
            bio: "a bio",
            contacts: ["a contact"],
            hasFinishedRegistration: true,
            logo: "http://awebsite.com/alogo.jpg",
        });

        approved_test_company = await Company.create({
            name: " approved test company",
            bio: "a bio",
            contacts: ["a contact"],
            hasFinishedRegistration: true,
            logo: "http://awebsite.com/alogo.jpg",
        });

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
            approvedAt: Date.now(),
        });

        await Account.create({
            email: test_user_admin.email,
            password: await hash(test_user_admin.password),
            isAdmin: true
        });

        await Account.create({
            email: test_user_company.email,
            password: await hash(test_user_company.password),
            company: test_company._id,
        });

        await Account.create({
            email: approved_test_user_company.email,
            password: await hash(approved_test_user_company.password),
            company: approved_test_company._id,
        });

    });

    afterAll(async () => {
        await Company.deleteMany({});
        await Account.deleteMany({});
        await CompanyApplication.deleteMany({});
    });

    describe("Without pre-existing offers", () => {
        beforeAll(async () => {
            await Offer.deleteMany({});
        });

        beforeEach(async () => {
            await Offer.deleteMany({});
        });

        test("Offer should be pending if the company hasn't been approved", async () => {
            const offer = generateTestOffer({ owner: test_company._id });
            const res = await request()
                .post("/offers/new")
                .send(withGodToken(offer)).expect(HTTPStatus.OK);
            expect(res.body.isPending).toBe(true);
        });

        test("Offer should not be pending if the company has been approved", async () => {
            const offer = generateTestOffer({ owner: approved_test_company._id });
            const res = await request()
                .post("/offers/new")
                .send(withGodToken(offer)).expect(HTTPStatus.OK);
            expect(res.body.isPending).toBe(false);
        });
    });

});
