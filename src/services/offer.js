const Company = require("../models/Company");
const Offer = require("../models/Offer");

class OfferService {
    // TODO: Use typedi or similar
    constructor() {

    }

    static get MAX_OFFERS_PER_QUERY() {
        return 20;
    }

    async create({
        title,
        publishDate = new Date(Date.now()),
        publishEndDate,
        jobMinDuration,
        jobMaxDuration,
        jobStartDate,
        description,
        contacts,
        isPaid,
        vacancies,
        jobType,
        fields,
        technologies,
        isHidden,
        owner,
        location,
        coordinates,
    }) {

        const ownerName = (await Company.findById(owner)).name;
        const offer = await Offer.create({
            title,
            publishDate,
            publishEndDate,
            jobMinDuration,
            jobMaxDuration,
            jobStartDate,
            description,
            contacts,
            isPaid,
            vacancies,
            jobType,
            fields,
            technologies,
            isHidden,
            owner,
            ownerName,
            location,
            coordinates,
        });

        return offer;
    }

    /**
     * Fetches offers according to specified options
     * @param {*} options
     * value: Text to use in full-text-search
     * offset: Point to start looking (and limiting)
     * limit: How many offers to show
     * jobType: Array of jobTypes allowed
     */
    get({ value = "", offset = 0, limit = OfferService.MAX_OFFERS_PER_QUERY, showHidden = false, ...filters }) {

        const offers = value ? Offer.find(
            { "$and": [this._buildFilterQuery(filters), { "$text": { "$search": value } }] }, { score: { "$meta": "textScore" } }
        ) : Offer.find(this._buildFilterQuery(filters)).current();

        if (!showHidden) offers.withoutHidden();

        return offers
            .sort(value ? { score: { "$meta": "textScore" } } : undefined)
            .skip(offset)
            .limit(limit)
        ;

    }
    _buildFilterQuery(filters) {
        if (!filters || !Object.keys(filters).length) return {};

        const { jobType, jobMinDuration, jobMaxDuration, fields, technologies } = filters;
        const constraints = [];

        if (jobType) constraints.push({ jobType: { "$in": jobType } });
        if (jobMinDuration) constraints.push({ jobMinDuration: { "$gte": jobMinDuration } });
        if (jobMaxDuration) constraints.push({ jobMaxDuration: { "$lte": jobMaxDuration } });
        if (fields?.length) constraints.push({ fields: {  "$elemMatch": { "$in": fields } } });
        if (technologies?.length) constraints.push({ technologies: {  "$elemMatch": { "$in": technologies } } });

        return constraints.length ? { "$and": constraints } : {};
    }

    async getOfferByID({ id = 0 }) {
        const offer = await Offer.findById(id).current();

        return offer;
    }

}

module.exports = OfferService;
