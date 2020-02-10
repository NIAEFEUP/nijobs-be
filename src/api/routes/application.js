const HTTPStatus = require("http-status-codes");
const { Router } = require("express");

const validators = require("../middleware/validators/application");
const AuthService = require("../../services/application");

const router = Router();

module.exports = (app) => {
    app.use("/application", router);

    /**
     * Creates a new Company Application
     */
    router.post("/", validators.create, async (req, res) => {
        try {
            // This is safe since the service is destructuring the passed object and the fields have been validated
            const offer = await (new AuthService()).create(req.body);

            return res.json(offer);
        } catch (err) {
            console.error(err);
            return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).send();
        }
    });
};
