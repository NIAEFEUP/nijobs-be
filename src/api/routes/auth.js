const { Router } = require("express");
const passport = require("passport");

const { authRequired, isGod } = require("../middleware/auth");
const validators = require("../middleware/validators/auth");
const AuthService = require("../../services/auth");


const router = Router();

module.exports = (app) => {
    app.use("/auth", router);

    // Get logged in user info
    router.get("/me", authRequired, (req, res) => {
        const userInfo = req.user;
        return res.status(200).json({
            data: {
                _id: userInfo._id,
                email: userInfo.email,
            },
        });
    });

    // Login endpoint
    router.post("/login", passport.authenticate("local"), (req, res) => res.status(200).json({}));

    // Logout endpoint
    router.delete("/login", authRequired, (req, res) => {
        req.logout();
        return res.status(200).json({});
    });

    // Register endpoint
    router.post("/register", isGod, validators.register, async (req, res, next) => {
        const { email, password } = req.body;

        // Inserting user into db and replying with success or not
        try {
            const data = await (new AuthService()).register(email, password);

            return res.status(200).json({
                data,
            });
        } catch (err) {
            return next(err);
        }
    });
};
