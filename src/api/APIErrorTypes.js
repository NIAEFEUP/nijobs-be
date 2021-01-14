const APIErrorTypes = Object.freeze({
    DEFAULT: "invalid",
    OFFER_NOT_FOUND: (id) => `no-offer-found-with-id:${id}`,
});

module.exports = APIErrorTypes;
