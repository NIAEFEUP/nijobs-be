const { Router } = require("express");

const companyMiddleware = require("../middleware/company");
const authMiddleware = require("../middleware/auth");
const validators = require("../middleware/validators/offer");
const OfferService = require("../../services/offer");

const router = Router();

module.exports = (app) => {
    app.use("/offer", router);

    /**
     * Gets all currently active offers (without filtering, for now)
     */
    router.get("/", validators.get, async (req, res, next) => {
        try {
            const offers = await (new OfferService()).get(req.query);

            return res.json(offers);
        } catch (err) {
            return next(err);
        }
    });

    /**
     * Creates a new Offer
     */
    router.post("/", authMiddleware.isGod, validators.create, companyMiddleware.canCreateOffer, async (req, res, next) => {
        try {
            // This is safe since the service is destructuring the passed object and the fields have been validated
            const offer = await (new OfferService()).create(req.body);

            return res.json(offer);
        } catch (err) {
            return next(err);
        }
    });
};
