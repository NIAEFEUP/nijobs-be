const { Router } = require("express");

const authMiddleware = require("../middleware/auth");
const validators = require("../middleware/validators/offer");
const OfferService = require("../../services/offer");
const HTTPStatus = require("http-status-codes");

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
    router.get("/:offerId", validators.get, async (req, res, next) => {
        try {
            const offer = await (new OfferService()).getOfferById(req.params.offerId);
            if (offer !== null) {
                return res.json(offer);
            } else {
                return res.status(HTTPStatus.UNAUTHORIZED).json({
                    reason: `No offer with id:${req.params.offer}`,
                });
            }

        } catch (err) {
            return next(err);
        }
    });

    /**
     * Creates a new Offer
     */
    router.post("/new", authMiddleware.isCompanyOrGod, validators.create, async (req, res, next) => {
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
};
