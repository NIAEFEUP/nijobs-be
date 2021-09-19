import OfferService from "../../services/offer.js";
import * as companyMiddleware from "./company.js";

export const isOwnerNotDisabled = async (req, res, next) => {
    const offer = await (new OfferService()).getOfferById(req.params.offerId, req.targetOwner, true);

    return companyMiddleware.isNotDisabled(offer.owner)(req, res, next);
};
