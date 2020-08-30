const HTTPStatus = require("http-status-codes");
const { Router } = require("express");
const passport = require("passport");

const { authRequired, isGod } = require("../middleware/auth");
const validators = require("../middleware/validators/auth");
const AccountService = require("../../services/account");


const router = Router();

module.exports = (app) => {
    app.use("/auth", router);

    // Get logged in user info
    router.get("/me", authRequired, (req, res) => {
        const userInfo = req.user;
        return res.status(HTTPStatus.OK).json({
            data: {
                _id: userInfo._id,
                email: userInfo.email,
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
