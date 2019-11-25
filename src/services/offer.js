const Offer = require("../models/Offer");

class OfferService {
    // TODO: Use typedi or similar
    constructor() {

    }

    async create({
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

    async get() {
        const offers = await Offer.find().current();

        return offers;
    }
}

module.exports = OfferService;
