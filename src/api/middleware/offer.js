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
    const wantedTargetOwner = req.hasAdminPrivileges && req.body.owner;
    req.targetOwner = req.user?.company?._id.toString() || wantedTargetOwner || undefined;

    return next();
};
