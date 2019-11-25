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
        endDate,
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
            endDate,
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

    async get({ offset = 0, limit = OfferService.MAX_OFFERS_PER_QUERY }) {
        const offers = await Offer.find().current()
            .skip(offset).limit(limit);

        return offers;
    }
}

module.exports = OfferService;
