const Company = require("../models/Company");

class CompanyService {
    getOffersInTimePeriod(owner, publishDate, publishEndDate, OfferModel) {
        return OfferModel.find({
            owner,
            $or:
                [
                    { $and: [{ publishEndDate: { $gte: publishDate } }, { publishEndDate: { $lte: publishEndDate } }] },
                    { $and: [{ publishDate: { $gte: publishDate } }, { publishDate: { $lte: publishEndDate } }] },
                    { $and: [{ publishDate: { $lte: publishDate } }, { publishEndDate: { $gte: publishEndDate } }] }
                ]
        });
    }

    /**
     *
     * @param {*} limit - Number of documents to return
     * @param {*} offset - where to start the query (pagination - how many documents to skip, NOT how many pages to skip)
     *
     * @returns {companies, totalDocCount}
     */
    async findAll(limit, offset) {

        const totalDocCount = await Company.estimatedDocumentCount();

        return {
            totalDocCount,
            companies:
                [...(await Company.find({})
                    .sort({ Name: "desc" })
                    .skip(offset)
                    .limit(limit)
                    .exec()
                )]
                    .map((application) => application.toObject()),

        };
    }


    /**
     * 
     * @param {*} company_id Id of the company to change
     * @param {*} bio New bio for the company
     * 
     * @returns update Promise
     */
    changeBio(company_id, bio) {
        return Company.updateOne({ _id: company_id }, { bio })
    }

    /**
     * Sets a company profile to finished
     * @param {*} company_id Id of the company to change
     * 
     * @returns update Promise
     */
    setFinished(company_id) {
        return Company.updateOne({ _id: company_id }, { finished: true })
    }

}

module.exports = CompanyService;
