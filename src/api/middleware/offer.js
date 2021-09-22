import OfferService from "../../services/offer.js";
import * as companyMiddleware from "./company.js";

export const isOwnerNotDisabled = async (req, res, next) => {
    const offer = await (new OfferService()).getOfferById(req.params.offerId, req.targetOwner, true);

    return companyMiddleware.isNotDisabled(offer.owner)(req, res, next);
};

export const setTargetOwner = (req, res, next) => {

    req.targetOwner = req.user?.company?._id.toString() || req.body.owner;
    return next();
};

export const parseIsHiddden = (req, res, next) => {

    if (req.body?.isHidden !== undefined)
        req.body.isHidden = JSON.parse(req.body.isHidden);

    return next();
};
