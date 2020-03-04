const HTTPStatus = require("http-status-codes");
const { Router } = require("express");
const Offer = require("../../models/Offer");

const authMiddleware = require("../middleware/auth");
const validators = require("../middleware/validators/offer");
const ValidationReasons = require("../middleware/validators/validationReasons");
const OfferService = require("../../services/offer");
const OfferConstants = require("../../models/constants/Offer");

const router = Router();

module.exports = (app) => {
    app.use("/offer", router);

    /**
     * Gets all currently active offers (without filtering, for now)
     */
    router.get("/", validators.get, async (req, res) => {
        try {
            const offers = await (new OfferService()).get(req.query);

            return res.json(offers);
        } catch (err) {
            console.error(err);
            return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send();
        }
    });

    /**
     * Creates a new Offer
     */
    router.post("/", authMiddleware.isGod, validators.create, async (req, res) => {
        try {

            const active_offers = await Offer.find().activeOffersCount(req.body.owner);
            const max_allowed = OfferConstants.active_offers.max;

            // This is safe since the service is destructuring the passed object and the fields have been validated
            if (active_offers < max_allowed) {
                const offer = await (new OfferService()).create(req.body);

                return res.json(offer);
            } else throw new Error(ValidationReasons.OFFER_LIMIT_REACHED(req.body.owner));

        } catch (err) {
            console.error(err);
            return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send();
        }
    });

};
