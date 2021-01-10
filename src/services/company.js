const Company = require("../models/Company");

class CompanyService {
    // TODO
    constructor() {

    }

    static get MAX_OFFERS_PER_COMPANY() {
        return 5;   // The value may change later
    }

    getCurrentOffers(companyOwner) {
        const today = Date.now();
        return Company.find({
            owner: companyOwner,
            publishEndDate: { $gte: { today } }
        });
    }
}

module.exports = CompanyService;
