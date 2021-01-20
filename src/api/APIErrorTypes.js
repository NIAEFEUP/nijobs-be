const APIErrorTypes = Object.freeze({
    OFFER_NOT_FOUND: (id) => `no-offer-found-with-id:${id}`,
});

module.exports = APIErrorTypes;
