const Offer = require("../models/Offer");

class CompanyService {
    // TODO
    constructor() {

    }

    static get MAX_OFFERS_PER_COMPANY() {
        return 5;   // The value may change later
    }

    getCurrentOffers(companyOwner) {
        return Offer.find({
            owner: companyOwner,
            publishEndDate: { $gte: Date.now() }
        });
    }
}

module.exports = CompanyService;
