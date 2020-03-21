const HTTPStatus = require("http-status-codes");
const { Router } = require("express");

const { isGod } = require("../middleware/auth");
const validators = require("../middleware/validators/offer");
const OfferService = require("../../services/offer");
const SearchService = require("../../services/search");

const router = Router();

module.exports = (app) => {
    app.use("/offer", router);

    /**
     * Gets all currently active offers (without filtering, for now)
     */
    router.get("/", validators.get, async (req, res) => {
        try {
            const offers = await (new OfferService()).getActive(req.query);

            return res.json(offers);
        } catch (err) {
            console.error(err);
            return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send();
        }
    });

    /**
     * Gets all offers
     */
    router.get("/all", validators.get, async (req, res) => {
        try {
            const offers = await (new OfferService()).getAll(req.query);

            return res.json(offers);
        } catch (err) {
            console.error(err);
            return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send();
        }
    });

    /**
     * Search offers
     */
    router.get("/search", validators.search, async (req, res) => {
        try {
            const offers = await (new SearchService()).advanced(req.query);

            return res.json(offers);
        } catch (err) {
            console.error(err);
            return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send();
        }
    });

    /**
     * Creates a new Offer
     */
    router.post("/", isGod, validators.create, async (req, res) => {
        try {
            // This is safe since the service is destructuring the passed object and the fields have been validated
            const offer = await (new OfferService()).create(req.body);

            return res.json(offer);
        } catch (err) {
            console.error(err);
            return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send();
        }
    });

    /**
     * Deletes an Offer
     */
    router.delete("/:id", isGod, validators.id, async (req, res) => {
        const { id } = req.params;

        try {
            const result = await (new OfferService()).deleteById(id);

            return res.json(result);
        } catch (err) {
            console.error(err);
            return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send();
        }
    });
};
