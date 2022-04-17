import HTTPStatus from "http-status-codes";
import { ErrorTypes, APIError } from "./errorHandler.js";
import config from "../../config/env.js";
import OfferService from "../../services/offer.js";
import ValidationReasons from "./validators/validationReasons.js";
import { or } from "./utils.js";
import { decodeToken } from "../../lib/token.js";

// Middleware to require login in an endpoint
export const authRequired = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return next(new APIError(HTTPStatus.UNAUTHORIZED, ErrorTypes.FORBIDDEN, ValidationReasons.MUST_BE_LOGGED_IN));
};

// Eventually should be done via a session in an god account, but at least this will work for now, before a permission system is added
export const isGod = (req, res, next) => {
    if (!req.body.god_token) {
        return next(new APIError(HTTPStatus.UNAUTHORIZED, ErrorTypes.FORBIDDEN, ValidationReasons.MUST_BE_GOD));
    }
    if (req.body.god_token !== config.god_token) {
        return next(new APIError(HTTPStatus.UNAUTHORIZED, ErrorTypes.FORBIDDEN, ValidationReasons.BAD_GOD_TOKEN));
    }

    return next();
};

export const isCompany = (req, res, next) => {
    if (req?.user?.company) return next();
    else return next(new APIError(HTTPStatus.UNAUTHORIZED, ErrorTypes.FORBIDDEN, ValidationReasons.MUST_BE_COMPANY));
};

export const isAdmin = (req, res, next) => {
    if (!req.user?.isAdmin) {
        return next(new APIError(HTTPStatus.UNAUTHORIZED, ErrorTypes.FORBIDDEN, ValidationReasons.MUST_BE_ADMIN));
    }

    return next();
};

export const hasOwnershipRights = (offerId) => or([
    isOfferOwner(offerId),
    isGod,
    isAdmin],
{ status_code: HTTPStatus.FORBIDDEN, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }
);

export const isOfferOwner = (offerId) => async (req, res, next) => {

    try {
        const offer = await (new OfferService()).getOfferById(offerId, req.targetOwner, req.hasAdminPrivileges);

        if (offer.owner.toString() !== req.user?.company?._id.toString()) {
            return next(new APIError(HTTPStatus.FORBIDDEN, ErrorTypes.FORBIDDEN, ValidationReasons.NOT_OFFER_OWNER(offerId)));
        }
        return next();
    } catch (err) {
        console.error(err);
        throw err;
    }
};

export const hasAdminPrivileges = async (req, res, next) => {

    let unprivileged = false;

    await or([
        isGod,
        isAdmin
    ])(req, res, (errors) => {
        if (errors) unprivileged = true;
    });

    req.hasAdminPrivileges = !unprivileged;

    return next();
};

export const validToken = (req, res, next) => {
    const decoded = decodeToken(req.params.token, config.awt_secret);

    if (!decoded) {
        return next(new APIError(HTTPStatus.FORBIDDEN, ErrorTypes.FORBIDDEN, ValidationReasons.INVALID_TOKEN));
    }

    res.locals.token = decoded;

    return next();
};
