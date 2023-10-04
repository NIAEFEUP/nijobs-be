import OfferService from "../../services/offer.js";
import * as companyMiddleware from "./company.js";
import { when } from "./utils.js";

export const isOwnerNotDisabled = async (req, res, next) => {
    const offer = await (new OfferService()).getOfferById(req.params.offerId, req.targetOwner, true);

    return when(
        !req.hasAdminPrivileges,
        (req, res, next) => companyMiddleware.isNotDisabled(offer.owner)(req, res, next))(req, res, next);
};

export const isOwnerNotBlocked = async (req, res, next) => {
    const offer = await (new OfferService()).getOfferById(req.params.offerId, req.targetOwner, true);

    return when(
        !req.hasAdminPrivileges,
        (req, res, next) => companyMiddleware.isNotBlocked(offer.owner)(req, res, next))(req, res, next);
};

export const setTargetOwner = (req, res, next) => {
    const adminTargetOwner = req.hasAdminPrivileges && req.body.owner;
    req.targetOwner = req.user?.company?._id.toString() || adminTargetOwner || undefined;

    return next();
};
export const isPast = (req, res, next) => {
    if (new Date(req.body.publishDate).getTime() < Date.now()) {
        req.body.publishDate = new Date(Date.now()).toISOString();
    }
    return next();
};
