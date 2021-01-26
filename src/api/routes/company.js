const { Router } = require("express");

const validators = require("../middleware/validators/company");
const authMiddleware = require("../middleware/auth");

const router = Router();

module.exports = (app) => {
    app.use("/company", router);

    /**
     * Creates a new Company Application
     */
    router.post("/:id/finish", validators.finish, authMiddleware.isCompany,
        async (req, res, next) => {

            try {
                return res.json("Hello");
            } catch (err) {
                return next(err);
            }
        });
};
