const { Router } = require("express");
const passport = require("passport");

const ERROR_TYPES = require("./errors/errorHandler");
const { authRequired } = require("../middleware/auth");
const validators = require("../middleware/validators");
const AuthService = require("../../services/auth");

const router = Router();

module.exports = (app) => {
    app.use("/auth", router);

    // Get logged in user info
    router.get("/me", authRequired, (req, res) => {
        const userInfo = req.user;
        return res.status(200).json({
            success: true,
            data: {
                _id: userInfo._id,
                username: userInfo.username,
            },
        });
    });

    // Login endpoint
    router.post("/login", passport.authenticate("local"), (req, res) => res.status(200).json({
        success: true,
    }));

    // Logout endpoint
    router.delete("/login", authRequired, (req, res) => {
        req.logout();
        return res.status(200).json({
            success: true,
        });
    });

    // Register endpoint
    router.post("/register", validators.register, async (req, res) => {
        const { username, password } = req.body;

        // Inserting user into db and replying with success or not
        try {
            const data = await (new AuthService()).register(username, password);

            return res.status(200).json({
                success: true,
                data,
            });
        } catch (err) {
            return res.status(500).json({
                success: false,
                reason: "Database error (WIP)!",
                error_code: ERROR_TYPES.DB_ERROR,
            });
        }
    });
};
