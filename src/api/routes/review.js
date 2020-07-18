const { Router } = require("express");

const authMiddleware = require("../middleware/auth");
const companyApplicationValidators = require("../middleware/validators/application");
const ApplicationService = require("../../services/application");
const mongoose = require("mongoose");

const router = Router();

module.exports = (app) => {
    app.use("/applications/company", router);

    /**
     * Approves a Pending Company Application
     */
    router.get("/",
        authMiddleware.authRequired,
        authMiddleware.isAdmin,
        async (req, res, next) => {

            try {
                const applications = await (new ApplicationService()).findAll();
                return res.json(applications);
            } catch (err) {
                return next(err);
            }
        });

    /**
     * Approves a Pending Company Application
     */
    router.post("/:id/approve",
        authMiddleware.authRequired,
        authMiddleware.isAdmin,
        companyApplicationValidators.approve,
        async (req, res, next) => {

            try {
                const application = await (new ApplicationService()).approve(mongoose.Types.ObjectId(req.params.id));
                return res.json(application);
            } catch (err) {
                return next(err);
            }
        });

    /**
     * Rejects a Pending Company Application
     */
    router.post("/:id/reject",
        authMiddleware.authRequired,
        authMiddleware.isAdmin,
        companyApplicationValidators.reject,
        async (req, res, next) => {

            try {
                const application = await (new ApplicationService()).reject(mongoose.Types.ObjectId(req.params.id));
                return res.json(application);
            } catch (err) {
                return next(err);
            }
        });
};
