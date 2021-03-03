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
        requirements,
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
            requirements
        });
        return offer;
    }

    async edit(
        _id,
        {
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
            location,
            coordinates,
            requirements,
        }) {
        const edits = {
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
            location,
            coordinates,
            requirements,
        };
        const offer = await Offer.findOneAndUpdate(
            { _id },
            edits,
            { new: true, omitUndefined: true },
            (err) => {
                if (err) {
                    throw err;
                }
            }
        );

        return offer;
    }

    async disable(
        _id,
        hiddenReason
    ) {
        const offer = await Offer.findOneAndUpdate(
            { _id },
            {
                isHidden: true,
                hiddenReason
            },
            { new: true },
            (err) => {
                if (err) {
                    throw err;
                }
            }
        );
        return offer;
    }

    async enable(
        _id
    ) {
        const query = { _id };
        const offer = await Offer.findOneAndUpdate(
            query,
            {
                isHidden: false,
                $unset: { hiddenReason: undefined } // Removing property from document.
            },
            { new: true },
            (err) => {
                if (err) {
                    throw err;
                }
            }
        );
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

        const offers = (value ? Offer.find(
            { "$and": [this._buildFilterQuery(filters), { "$text": { "$search": value } }] }, { score: { "$meta": "textScore" } }
        ) : Offer.find(this._buildFilterQuery(filters))).current();

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
        if (jobMinDuration) {
            constraints.push({
                "$or": [
                    { jobMinDuration: { "$exists": false } },
                    { jobMinDuration: { "$gte": jobMinDuration } },
                    {
                        "$and": [
                            { jobMinDuration: { "$lt": jobMinDuration } },
                            { "$or": [
                                { jobMaxDuration: { "$exists": false } },
                                { jobMaxDuration: { "$gte": jobMinDuration } },
                            ] }
                        ]
                    },
                ]
            });
        }
        if (jobMaxDuration) {
            constraints.push({
                "$or": [
                    { jobMaxDuration: { "$exists": false } },
                    { jobMaxDuration: { "$lte": jobMaxDuration } },
                    {
                        "$and": [
                            { jobMaxDuration: { "$gt": jobMaxDuration } },
                            { "$or": [
                                { jobMinDuration: { "$exists": false } },
                                { jobMinDuration: { "$lte": jobMaxDuration } },
                            ] }
                        ]
                    },
                ]
            });
        }
        if (fields?.length) constraints.push({ fields: {  "$elemMatch": { "$in": fields } } });
        if (technologies?.length) constraints.push({ technologies: {  "$elemMatch": { "$in": technologies } } });

        return constraints.length ? { "$and": constraints } : {};
    }

    async getOfferById(offerId, user) {
        const offer = await Offer.findById(offerId);

        if (offer?.isHidden && !(user?.isAdmin || offer.owner.toString() === user?.company?._id.toString())) return null;

        return offer;
    }

}

module.exports = OfferService;
