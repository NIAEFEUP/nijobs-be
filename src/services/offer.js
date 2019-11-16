const Offer = require("../models/Offer");

class AuthService {
    // TODO: Use typedi or similar
    constructor() {

    }

    async create({ title }) {
        const offer = await Offer.create({
            title,
        });

        // Probably should not return everything. We should check what fields are relevant and return those
        return offer;
    }
}

module.exports = AuthService;
