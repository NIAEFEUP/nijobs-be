const Company = require("../src/models/Company");
const SchemaTester = require("./utils/SchemaTester");
const CompanyConstants = require("../src/models/constants/Company");
const { DAY_TO_MS } = require("./utils/TimeConstants");
const Offer = require("../src/models/Offer");

const CompanySchemaTester = SchemaTester(Company);

describe("# Company Schema tests", () => {
    describe("Required and bound (min and max) properties tests", () => {
        describe("required using schema 'required' property (no user defined validators)", () => {
            CompanySchemaTester.fieldRequired("name");
        });

        describe("Required to respect a certain length", () => {
            CompanySchemaTester.maxLength("bio", CompanyConstants.bio.max_length);
            CompanySchemaTester.minLength("name", CompanyConstants.companyName.min_length);
            CompanySchemaTester.maxLength("name", CompanyConstants.companyName.max_length);
        });
    });

    describe("Hook tests", () => {

        describe("Company name update", () => {

            let company;

            beforeAll(async () => {
                company = await Company.create({
                    name: "first name",
                    logo: "http://awebsite.com/alogo.jpg",
                });
                const offer = {
                    title: "Test Offer",
                    publishDate: new Date(Date.now() - (DAY_TO_MS)),
                    publishEndDate: new Date(Date.now() + (DAY_TO_MS)),
                    description: "For Testing Purposes",
                    contacts: ["geral@niaefeup.pt", "229417766"],
                    jobType: "SUMMER INTERNSHIP",
                    fields: ["DEVOPS", "MACHINE LEARNING", "OTHER"],
                    technologies: ["React", "CSS"],
                    location: "Testing Street, Test City, 123",
                    requirements: ["The candidate must be tested", "Fluent in testJS"],
                    owner: company._id,
                    ownerName: company.name,
                    ownerLogo: company.logo,
                };

                await Offer.create([offer, offer]);
            });

            afterAll(async () => {
                await Offer.deleteMany({});
                await Company.deleteMany({});
            });

            test("Should update offers ownerName on company name update", async () => {
                const offersBefore = await Offer.find({ owner: company._id });

                expect(offersBefore.every(({ ownerName }) => ownerName === "first name")).toBe(true);

                await Company.findByIdAndUpdate(company._id, { name: "new name" }, { new: true });

                const offersAfter = await Offer.find({ owner: company._id });

                expect(offersAfter.every(({ ownerName }) => ownerName === "new name")).toBe(true);
            });
        });
    });
});
