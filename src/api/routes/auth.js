const HTTPStatus = require("http-status-codes");
const { Router } = require("express");
const passport = require("passport");

const { authRequired, isGod } = require("../middleware/auth");
const validators = require("../middleware/validators/auth");
const AccountService = require("../../services/account");
const Company = require("../../models/Company");


const router = Router();

module.exports = (app) => {
    app.use("/auth", router);

    // Get logged in user info
    router.get("/me", authRequired, async (req, res) => {
        const { email, isAdmin, company: companyId } = req.user;

        let company = undefined;

        try {
            if (companyId)
                company = await Company.findById(companyId);
        } catch (e) {
            console.error(`Could not find the respective company of user ${req.user._id}, with id ${companyId}`, e);
        }

        return res.status(HTTPStatus.OK).json({
            data: {
                email,
                isAdmin,
                company
            },
        });
    });

    // Login endpoint
    router.post("/login", validators.login, passport.authenticate("local"), (req, res) => res.status(HTTPStatus.OK).json({}));

    // Logout endpoint
    router.delete("/login", authRequired, (req, res) => {
        req.logout();
        return res.status(HTTPStatus.OK).json({});
    });

    // Register endpoint
    router.post("/register", isGod, validators.register, async (req, res, next) => {
        const { email, password } = req.body;

        // Inserting user into db and replying with success or not
        try {
            const data = await (new AccountService()).registerAdmin(email, password);

            return res.status(HTTPStatus.OK).json({
                data,
            });
        } catch (err) {
            return next(err);
        }
    });
};
