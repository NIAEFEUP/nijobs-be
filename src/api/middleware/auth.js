const { ErrorTypes, APIError } = require("./errorHandler");
const config = require("../../config/env");
const HTTPStatus = require("http-status-codes");
const OfferService = require("../../services/offer");
const ValidationReasons = require("./validators/validationReasons");
const { or } = require("./utils");

// Middleware to require login in an endpoint
const authRequired = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return next(new APIError(HTTPStatus.UNAUTHORIZED, ErrorTypes.FORBIDDEN, ValidationReasons.MUST_BE_LOGGED_IN));
};

// Eventually should be done via a session in an god account, but at least this will work for now, before a permission system is added
const isGod = (req, res, next) => {
    if (!req.body.god_token) {
        return next(new APIError(HTTPStatus.UNAUTHORIZED, ErrorTypes.FORBIDDEN, ValidationReasons.MUST_BE_GOD));
    }
    if (req.body.god_token !== config.god_token) {
        return next(new APIError(HTTPStatus.UNAUTHORIZED, ErrorTypes.FORBIDDEN, ValidationReasons.BAD_GOD_TOKEN));
    }

    return next();
};

const isCompany = (req, res, next) => {
    if (req?.user?.company) return next();
    else return next(new APIError(HTTPStatus.UNAUTHORIZED, ErrorTypes.FORBIDDEN, ValidationReasons.MUST_BE_COMPANY));
};

const isAdmin = (req, res, next) => {
    if (!req.user?.isAdmin) {
        return next(new APIError(HTTPStatus.UNAUTHORIZED, ErrorTypes.FORBIDDEN, ValidationReasons.MUST_BE_ADMIN));
    }

    return next();
};

const hasOwnershipRights = (offerId) => or([
    isOfferOwner(offerId),
    isGod,
    isAdmin],
{ status_code: HTTPStatus.FORBIDDEN, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }
);

const isOfferOwner = (offerId) => async (req, res, next) => {

    try {
        const offer = await (new OfferService()).getOfferById(offerId, req.user, req.hasAdminPrivileges);

        if (offer.owner.toString() !== req.user?.company?._id.toString()) {
            return next(new APIError(HTTPStatus.FORBIDDEN, ErrorTypes.FORBIDDEN, ValidationReasons.NOT_OFFER_OWNER(offerId)));
        }
        return next();
    } catch (err) {
        console.error(err);
        throw err;
    }
};

const hasAdminPrivileges = async (req, res, next) => {

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

module.exports = {
    authRequired,
    isGod,
    isAdmin,
    isCompany,
    isOfferOwner,
    hasOwnershipRights,
    hasAdminPrivileges,
};
