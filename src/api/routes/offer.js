const { Router } = require("express");

const authMiddleware = require("../middleware/auth");
const validators = require("../middleware/validators/offer");
const OfferService = require("../../services/offer");

const router = Router();

module.exports = (app) => {
    app.use("/offer", router);

    /**
     * Creates a new Offer
     */
    router.post("/", authMiddleware.isAdmin, validators.create, async (req, res) => {
        console.log(req.body);

        try {
            // This is safe since the service is destructuring the passed object and the fields have been validated
            const offer = await (new OfferService()).create(req.body);

            return res.json(offer);
        } catch (err) {
            console.error(err);
            return res.status(500).send();
        }
    });
};
