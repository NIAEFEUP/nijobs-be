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

    async get({ offset = 0, limit = OfferService.MAX_OFFERS_PER_QUERY, showHidden = false }) {

        let offers;

        if (showHidden) {
            offers = await Offer.find().current()
                .skip(offset).limit(limit);
        } else {
            offers = await Offer.find().bright()
                .skip(offset).limit(limit);
        }

        return offers;
    }
}

module.exports = OfferService;
