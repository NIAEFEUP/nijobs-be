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
    router.post("/", authMiddleware.isAdmin, validators.create, (req, res) => {
        console.log(req.body);
        return res.json({});
    });
};
