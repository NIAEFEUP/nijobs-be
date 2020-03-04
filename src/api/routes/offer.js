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
            const offer = await (new OfferService()).create(req.body);

            return res.json(offer);
        } catch (err) {
            console.error(err);
            return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send();
        }
    });

};
