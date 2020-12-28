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
            location,
            coordinates,
        });

        return offer;
    }

    async get({ value = "", offset = 0, limit = OfferService.MAX_OFFERS_PER_QUERY, showHidden = false }) {

        const offers = value ? Offer.find(
            { "$text": { "$search": value } }, { score: { "$meta": "textScore" } }
        ) : Offer.find({}, { score: { "$meta": "textScore" } }).current();

        if (!showHidden) offers.withoutHidden();

        return Promise.all((await offers
            .sort({ score: { "$meta": "textScore" } })
            .skip(offset)
            .limit(limit)
        ).map((o) => o.withCompany()));

    }
}

module.exports = OfferService;
