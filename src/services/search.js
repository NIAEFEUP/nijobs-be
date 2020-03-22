const Offer = require("../models/Offer");

const {
    queryOfferSimple,
    matchJobType,
    matchJobDuration,
    matchFields,
    matchTecnologies,
    push,
} = require("../lib/elasticDSL");

class SearchService {
    constructor() {

    }

    /**
     * Search for offers matching a Lucene search query string
     *
     * @param {String} q
     * @returns {Promise<Offer[]>}
     */
    async simple(q) {
        const query = {
            query: queryOfferSimple(q),
        };

        const offers = await Offer.esSearch(query);

        return offers;
    }

    /**
     * Search for offers given a set of query criteria and filter criteria
     *
     * @param {Object} query
     * @returns {Promise<Offer[]>}
     */
    async advanced({
        q,
        jobType,
        jobMinDuration,
        jobMaxDuration,
        fields,
        technologies,
    }) {
        const query = {
            query: {
                bool: {
                    should: [
                        ...push(queryOfferSimple(q)),
                        ...push(matchFields(fields)),
                        ...push(matchTecnologies(technologies)),
                    ],
                    filter: [
                        ...push(matchJobDuration(jobMinDuration, jobMaxDuration)),
                        ...push(matchJobType(jobType)),
                    ],
                },
            },
        };

        const offers = await Offer.esSearch(query);

        return offers;
    }
}

module.exports = SearchService;
