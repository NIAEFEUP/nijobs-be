const Offer = require("../models/Offer");

class CompanyService {
    // TODO
    constructor() {

    }

    getOffersInTimePeriod(owner, publishDate, publishEndDate, offer) {
        const test = offer || Offer;
        return test.find({
            owner,

            $or: [{ $and: [{ publishEndDate: { $gte: publishDate } }, { publishEndDate: { $lte: publishEndDate } }] },
                { $and: [{ publishDate: { $gte: publishDate } }, { publishDate: { $lte: publishEndDate } }] },
                { $and: [{ publishDate: { $lte: publishDate } }, { publishEndDate: { $gte: publishEndDate } }] }]
        });
    }
}

module.exports = CompanyService;
