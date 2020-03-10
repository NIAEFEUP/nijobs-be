const HTTPStatus = require("http-status-codes");
const { Router } = require("express");

const ApplicationService = require("../../services/application");
const authMiddleware = require("../middleware/auth");
const validators = require("../middleware/validators/application_admin");

const router = Router();

module.exports = (app) => {
    app.use("/application", router);

    /**
     * Returns active company applicaitions
     */
    router.get("/", authMiddleware.authRequired, authMiddleware.isAdmin, validators.get, async (req, res) => {
        try {

            const applications = await (new ApplicationService()).get(req.query);
            return res.json(applications);
        } catch (err) {
            console.error(err);
            return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send();
        }
    });

    /**
     * Accepts the application of a company
     */
    router.put("/:id/accept", authMiddleware.authRequired, authMiddleware.isAdmin, async (req, res) => {
        try {

            // This is safe since the service is destructuring the passed object and the fields have been validated
            const application = await (new ApplicationService()).accept(req.params.id);

            return res.json(application);
        } catch (err) {
            console.error(err);
            return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send();
        }
    });
};
