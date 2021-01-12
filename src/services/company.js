const Offer = require("../models/Offer");

class CompanyService {
    // TODO
    constructor() {

    }

    getCurrentOffers(companyOwner) {
        return Offer.find({
            owner: companyOwner,
            publishEndDate: { $gte: Date.now() }
        });
    }
}

module.exports = CompanyService;
