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

    async getActive({ offset = 0, limit = OfferService.MAX_OFFERS_PER_QUERY }) {
        const offers = await Offer.find().current()
            .skip(offset).limit(limit);

        return offers;
    }

    async getAll({ offset = 0, limit = OfferService.MAX_OFFERS_PER_QUERY }) {
        const offers = await Offer.find()
            .skip(offset).limit(limit);

        return offers;
    }

    async getId(id) {
        const offer = await Offer.findById(id);

        return offer;
    }

    async deleteId(id) {
        const result = await Offer.findByIdAndDelete(id);

        return result;
    }
}

module.exports = OfferService;
