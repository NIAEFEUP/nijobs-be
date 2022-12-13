import { Router } from "express";
import { StatusCodes as HTTPStatus } from "http-status-codes";

import * as authMiddleware from "../middleware/auth.js";
import * as companyMiddleware from "../middleware/company.js";
import * as offerMiddleware from "../middleware/offer.js";
import * as validators from "../middleware/validators/offer.js";
import OfferService from "../../services/offer.js";
import { ErrorTypes, APIError } from "../middleware/errorHandler.js";
import ValidationReasons from "../middleware/validators/validationReasons.js";
import { or, when } from "../middleware/utils.js";
import OfferConstants from "../../models/constants/Offer.js";
import * as companyValidators from "../middleware/validators/company.js";

const router = Router();

export default (app) => {
    app.use("/offers", router);

    router.use(offerMiddleware.setTargetOwner);

    /**
     * Searches currently active offers
     */
    router.get("/", validators.get, async (req, res, next) => {
        try {
            const resultsAndQueryToken = await (new OfferService()).get(
                {
                    ...req.query,
                    showHidden: req?.query?.showHidden && req.hasAdminPrivileges,
                    showAdminReason: req.hasAdminPrivileges
                }
            );

            return res.json(resultsAndQueryToken);
        } catch (err) {
            console.error(err);
            return next(err);
        }
    });

    /**
     * Gets an offer from the database with its id
    */
    router.get("/:offerId", validators.validOfferId, async (req, res, next) => {
        try {
            const offer = await (new OfferService()).getOfferById(
                req.params.offerId, req.targetOwner, req.hasAdminPrivileges, req.hasAdminPrivileges);

            if (!offer) {
                return next(new APIError(
                    HTTPStatus.NOT_FOUND,
                    ErrorTypes.FORBIDDEN,
                    ValidationReasons.OFFER_NOT_FOUND(req.params.offerId)
                ));
            }

            return res.json(offer);

        } catch (err) {
            console.error(err);
            return next(err);
        }
    });

    /**
     * Gets all the offers of a certain company from the db
     */
    router.get("/company/:companyId", companyValidators.getOffers, async (req, res, next) => {
        try {
            const offers = await (new OfferService()).getOffersByCompanyId(req.params.companyId, req.targetOwner, req.hasAdminPrivileges);

            return res.json(offers);
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
        (req, res, next) => companyMiddleware.isNotBlocked(req.targetOwner)(req, res, next),
        companyMiddleware.verifyMaxConcurrentOffersOnCreate,
        when(
            // if we are a company creating an offer, we can't be disabled, but admins/gods can create offers in our name
            (req) => !req.hasAdminPrivileges,
            (req, res, next) => companyMiddleware.isNotDisabled(req.targetOwner)(req, res, next)),
        validators.offersDateSanitizers,
        async (req, res, next) => {
            try {

                const params = {
                    ...req.body,
                    owner: req.targetOwner
                };

                const offer = await (new OfferService()).create(params);

                return res.json(offer);
            } catch (err) {
                console.error(err);
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
        offerMiddleware.isOwnerNotDisabled,
        validators.canBeManaged,
        validators.edit,
        (req, res, next) => authMiddleware.hasOwnershipRights(req.params.offerId)(req, res, next),
        companyMiddleware.verifyMaxConcurrentOffersOnEdit,
        validators.offersDateSanitizers,
        async (req, res, next) => {
            try {
                const offer = await (new OfferService()).edit(req.params.offerId, req.body);
                return res.json(offer);
            } catch (err) {
                console.error(err);
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
        offerMiddleware.isOwnerNotDisabled,
        validators.canHide,
        async (req, res, next) => {
            try {
                const offer = await (new OfferService()).disable(req.params.offerId, OfferConstants.HiddenOfferReasons.COMPANY_REQUEST);
                return res.json(offer);
            } catch (err) {
                console.error(err);
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
        validators.offerOwnerNotDisabled,
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
                console.error(err);
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
        validators.offerOwnerNotDisabled,
        async (req, res, next) => {
            try {
                const offer = await (new OfferService()).enable(req.params.offerId);
                return res.json(offer);
            } catch (err) {
                console.error(err);
                return next(err);
            }
        });

    /*
     * Archives a given offer
     *
     * This action is irreversible
     */
    router.put("/:offerId/archive",
        or([
            authMiddleware.isCompany,
            authMiddleware.isAdmin,
            authMiddleware.isGod,
        ], { status_code: HTTPStatus.UNAUTHORIZED, error_code: ErrorTypes.FORBIDDEN, msg: ValidationReasons.INSUFFICIENT_PERMISSIONS }),
        validators.isExistingOffer,
        (req, res, next) => authMiddleware.hasOwnershipRights(req.params.offerId)(req, res, next),
        offerMiddleware.isOwnerNotDisabled,
        offerMiddleware.isOwnerNotBlocked,
        async (req, res, next) => {
            try {
                const offer = await (new OfferService()).archive(req.params.offerId);
                return res.json(offer);
            } catch (err) {
                console.error(err);
                return next(err);
            }
        });
};
