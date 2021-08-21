const OfferService = require("../../services/offer");
const companyMiddleware = require("./company");

const isOwnerNotDisabled = async (req, res, next) => {
    const offer = await (new OfferService()).getOfferById(req.params.offerId, req.targetOwner, true);

    return companyMiddleware.isNotDisabled(offer.owner)(req, res, next);
};

module.exports = {
    isOwnerNotDisabled,
};
