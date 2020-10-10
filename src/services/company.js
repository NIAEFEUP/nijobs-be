const Offer = require("../models/Company");

class CompanyService {
    // TODO: Use typedi or similar
    constructor() {

    }

    async getOffers(companyId) {
        const offers = Offer.find({owner: companyId});

        return offers;
    }
}

module.exports = CompanyService;
