const { Router } = require("express");

const authMiddleware = require("../middleware/auth");
const companyMiddleware = require("../middleware/company");
const validators = require("../middleware/validators/offer");
const OfferService = require("../../services/offer");
const HTTPStatus = require("http-status-codes");
const { ErrorTypes, APIError } = require("../middleware/errorHandler");
const ValidationReasons = require("../middleware/validators/validationReasons");
const { or, when } = require("../middleware/utils");
const OfferConstants = require("../../models/constants/Offer");

const router = Router();

module.exports = (app) => {
    app.use("/offers", router);

    /**
     * Gets all currently active offers (without filtering, for now)
     * supports offset and limit as query params
     */
    router.get("/", validators.get, async (req, res, next) => {
        try {
            const offers = await (new OfferService()).get(
                {
                    ...req.query,
                    showHidden: req?.query?.showHidden && req.hasAdminPrivileges,
                    showAdminReason: req.hasAdminPrivileges
                }
            );

            return res.json(offers);
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Gets an offer from the database with its id
    */
    router.get("/:offerId", validators.validOfferId, async (req, res, next) => {
        try {
            const offer = await (new OfferService()).getOfferById(
                req.params.offerId, req.user, req.hasAdminPrivileges, req.hasAdminPrivileges);

            if (!offer) {
                return next(new APIError(
                    HTTPStatus.NOT_FOUND,
                    ErrorTypes.FORBIDDEN,
                    ValidationReasons.OFFER_NOT_FOUND(req.params.offerId)
                ));
            }

            return res.json(offer);

        } catch (err) {
            return next(err);
        }
    });

    /**
     * Creates a new Offer
     */
    router.post("/new",
        validators.setDefaultValuesCreate,
        or([
            authMiddleware.isCompany,
            authMiddleware.isAdmin,
            authMiddleware.isGod
        ], { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        validators.create,
        companyMiddleware.profileComplete,
        (req, res, next) => companyMiddleware.isNotBlocked(req.ownerCompany)(req, res, next),
        when(
            (req) => !req.body?.isHidden,
            (req, res, next) => companyMiddleware.verifyMaxConcurrentOffers(req.ownerCompany)(req, res, next)),
        validators.offersDateSanitizers,
        async (req, res, next) => {
            try {

                const params = {
                    ...req.body,
                    owner: req.ownerCompany
                };

                const offer = await (new OfferService()).create(params);

                return res.json(offer);
            } catch (err) {
                return next(err);
            }
        });

    router.post(
        "/edit/:offerId",
        or([
            authMiddleware.isCompany,
            authMiddleware.isAdmin,
            authMiddleware.isGod
        ], { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        validators.isExistingOffer,
        validators.offerOwnerNotBlocked,
        validators.isEditable,
        validators.canBeManaged,
        validators.edit,
        (req, res, next) => authMiddleware.hasOwnershipRights(req.params.offerId)(req, res, next),
        validators.offersDateSanitizers,
        async (req, res, next) => {
            try {
                const offer = await (new OfferService()).edit(req.params.offerId, req.body);
                return res.json(offer);
            } catch (err) {
                return next(err);
            }
        });

    /**
     * Hides an offer.
     * Used by companies or admins to hide an offer
     * Offer can be later enabled by owner or admins
     */
    router.post(
        "/:offerId/hide",
        or([
            authMiddleware.isCompany,
            authMiddleware.isAdmin,
            authMiddleware.isGod
        ], { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        validators.validOfferId,
        validators.isExistingOffer,
        (req, res, next) => authMiddleware.hasOwnershipRights(req.params.offerId)(req, res, next),
        validators.canHide,
        async (req, res, next) => {
            try {
                const offer = await (new OfferService()).disable(req.params.offerId, OfferConstants.HiddenOfferReasons.COMPANY_REQUEST);
                return res.json(offer);
            } catch (err) {
                return next(err);
            }
        });

    /**
     * Disables an offer.
     * Used by admins or gods to disable an offer.
     * Leaves the offer in a state that only admins and gods can enable it again
     */
    router.post(
        "/:offerId/disable",
        or([
            authMiddleware.isAdmin,
            authMiddleware.isGod
        ], { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        validators.validOfferId,
        validators.disable,
        validators.isExistingOffer,
        validators.canDisable,
        async (req, res, next) => {
            try {
                const offerService = new OfferService();

                const offer = await offerService
                    .disable(
                        req.params.offerId,
                        OfferConstants.HiddenOfferReasons.ADMIN_BLOCK,
                        req.body.adminReason);
                await offerService.sendOfferDisabledNotification(req.params.offerId);
                return res.json(offer);
            } catch (err) {
                return next(err);
            }
        });

    /**
     * Enables an hidden/disabled offer
     * If hidden, can be enabled by anyone. If disabled, only an admin can enable it
     */
    router.put(
        "/:offerId/enable",
        or([
            authMiddleware.isCompany,
            authMiddleware.isAdmin,
            authMiddleware.isGod,
        ], { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        validators.validOfferId,
        validators.isExistingOffer,
        (req, res, next) => authMiddleware.hasOwnershipRights(req.params.offerId)(req, res, next),
        validators.canBeEnabled,
        validators.canBeManaged,
        validators.offerOwnerNotBlocked,
        async (req, res, next) => {
            try {
                const offer = await (new OfferService()).enable(req.params.offerId);
                return res.json(offer);
            } catch (err) {
                return next(err);
            }
        });
};
