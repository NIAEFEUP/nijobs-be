const { ErrorTypes } = require("./errorHandler");
const config = require("../../config/env");
const HTTPStatus = require("http-status-codes");
const OfferService = require("../../services/offer");
const ValidationReasons = require("./validators/validationReasons");
const { buildErrorResponse } = require("./errorHandler");

// Middleware to require login in an endpoint
const authRequired = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(HTTPStatus.UNAUTHORIZED).json(
        buildErrorResponse(
            ErrorTypes.FORBIDDEN,
            ValidationReasons.MUST_BE_LOGGED_IN
        ));
};

// Eventually should be done via a session in an god account, but at least this will work for now, before a permission system is added
const isGod = (req, res, next) => {
    if (!req.body.god_token) {
        return res.status(HTTPStatus.UNAUTHORIZED).json(
            buildErrorResponse(
                ErrorTypes.FORBIDDEN,
                [ValidationReasons.INSUFFICIENT_PERMISSIONS]
            )
        );
    }
    if (req.body.god_token !== config.god_token) {
        return res.status(HTTPStatus.UNAUTHORIZED).json(
            buildErrorResponse(
                ErrorTypes.FORBIDDEN,
                [ValidationReasons.BAD_GOD_TOKEN]
            ));
    }

    return next();
};

const isCompanyOrGod = (req, res, next) => {
    if (req?.user?.company) return next();

    return isGod(req, res, next);
};

const isCompanyOrAdminOrGod = (req, res, next) => {
    if (req?.user?.company) return next();

    return isAdminOrGod(req, res, next);
};


const isAdmin = (req, res, next) => {
    if (!req.user?.isAdmin) {
        return res.status(HTTPStatus.UNAUTHORIZED).json(
            buildErrorResponse(ErrorTypes.FORBIDDEN, ["The user is not an admin"]));
    }

    return next();
};

const isAdminOrGod = (req, res, next) => {
    if (!req?.user?.isAdmin) {
        return isGod(req, res, next);
    }

    return next();
};

const isOfferOwner = (offerId) => async (req, res, next) => {

    try {
        const offer = await (new OfferService()).getOfferById(offerId, req.user);

        if (offer.owner.toString() !== req.user?.company?._id.toString() &&
                req.body.god_token !== config.god_token &&
                !req.user?.isAdmin) {
            return res.status(HTTPStatus.FORBIDDEN).json(
                buildErrorResponse(ErrorTypes.FORBIDDEN, [ValidationReasons.NOT_OFFER_OWNER(offerId)])
            );
        }
        return next();
    } catch (err) {
        console.error(err);
        throw err;
    }
};

module.exports = {
    authRequired,
    isGod,
    isAdmin,
    isAdminOrGod,
    isCompanyOrGod,
    isCompanyOrAdminOrGod,
    isOfferOwner,
};
