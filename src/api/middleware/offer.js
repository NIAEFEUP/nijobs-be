import OfferService from "../../services/offer.js";
import * as companyMiddleware from "./company.js";
import { when, existingModel } from "./utils.js";
import ValidationReasons from "./validators/validationReasons.js";

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

export const existingOffer = existingModel(
    (param, req) =>
        new OfferService().getOfferById(
            param,
            req.targetOwner,
            req.hasAdminPrivileges,
            req.hasAdminPrivileges
        ),
    "offerId",
    "offer",
    ValidationReasons.OFFER_NOT_FOUND
);
