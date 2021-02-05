const { Router } = require("express");

const authMiddleware = require("../middleware/auth");
const companyMiddleware = require("../middleware/company");
const validators = require("../middleware/validators/offer");
const OfferService = require("../../services/offer");
const HTTPStatus = require("http-status-codes");
const { buildErrorResponse, ErrorTypes } = require("../middleware/errorHandler");
const ValidationReasons = require("../middleware/validators/validationReasons");

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
                    showHidden: req?.query?.showHidden && req?.user?.isAdmin
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
    router.get("/:offerId", validators.getOfferById, async (req, res, next) => {
        try {
            const offer = await (new OfferService()).getOfferById(req.params.offerId, req.user);

            if (!offer) {
                return res.status(HTTPStatus.NOT_FOUND).json(
                    buildErrorResponse(
                        ErrorTypes.FORBIDDEN,
                        [ValidationReasons.OFFER_NOT_FOUND(req.params.offerId)]
                    )
                );
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
        authMiddleware.isCompanyOrAdminOrGod,
        validators.create,
        companyMiddleware.verifyMaxConcurrentOffers,
        validators.offersDateSanitizers,
        async (req, res, next) => {
            try {

                const params = {
                    ...req.body,
                    owner: req?.user?.company || req.body.owner
                };

                const offer = await (new OfferService()).create(params);

                return res.json(offer);
            } catch (err) {
                return next(err);
            }
        });

    router.post(
        "/edit/:offerId",
        authMiddleware.isCompanyOrAdminOrGod,
        validators.isExistingOffer,
        validators.isEditable,
        validators.edit,
        (req, res, next) => authMiddleware.isOfferOwner(req.params.offerId)(req, res, next),
        validators.offersDateSanitizers,
        async (req, res, next) => {
            try {
                const offer = await (new OfferService()).edit(req.params.offerId, req.body);
                return res.json(offer);
            } catch (err) {
                return next(err);
            }
        });
};
