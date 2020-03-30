const fs = require("fs");
const mongoose = require("mongoose");

const setupDbConnection = require("../src/loaders/mongoose");
const OfferModel = require("../src/models/Offer");
const CompanyModel = require("../src/models/Company");

function linkOffersToCompanies(mockOffers, companyDocs) {
    const companies = {};
    for (const comp of companyDocs)
        companies[comp._stubid] = comp;
    for (const mockOffer of mockOffers)
        mockOffer.owner = companies[mockOffer._company]._id;
}

async function clean() {
    await OfferModel.deleteMany({});
    await CompanyModel.deleteMany({});
}

async function populate() {
    const mockOffers = JSON.parse(fs.readFileSync("mock/offers.json"));
    const mockCompanies = JSON.parse(fs.readFileSync("mock/companies.json"));

    const companyDocs = await CompanyModel.insertMany(mockCompanies);
    linkOffersToCompanies(mockOffers, companyDocs);
    await OfferModel.insertMany(mockOffers);
}

async function run() {
    await setupDbConnection();
    const action = process.argv[2] || "reset";

    switch (action) {
        case "reset":
            await clean();
            await populate();
            break;
        case "clean": case "delete":
            await clean();
            break;
        case "populate":
            await populate();
            break;
        default:
            console.error(`Unknown action ${action}`);
    }

    await mongoose.disconnect();
}

run();
