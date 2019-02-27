const express = require("express");
const router = express.Router();
const passport = require("passport");

const ERROR_TYPES = require("./errors/errorHandler");
const Account = require("../models/Account");
const authRequired = require("../auth_controller");

// Get logged in user
router.get("/login", authRequired, (req, res) => {
    const userInfo = req.user;
    return res.status(200).json({
        "success": true,
        "data": {
            "_id": userInfo._id,
            "username": userInfo.username
        }
    });
});

// Login endpoint
router.post("/login", passport.authenticate("local"), (req, res) => {
    return res.status(200).json({
        "success": true,
    });
});


// Logout endpoint
router.delete("/login", authRequired, (req, res) => {
    req.logout();
    return res.status(200).json({
        "success": true,
    });
});

// Register endpoint
router.post("/register", async (req, res) => {
    // Username is required
    if (!req.body.username) {
        return res.status(400).json({
            "success": false,
            "reason": "No username specified",
            "error_code": ERROR_TYPES.MISSING_FIELD,
        });
    }

    // Password is required 
    if (!req.body.password) {
        return res.status(400).json({
            "success": false,
            "reason": "No password specified",
            "error_code": ERROR_TYPES.MISSING_FIELD,
        });
    }

    // Inserting user into db and replying with success or not
    try {

        // Future note: the promise returns the inserted model, which can be useful for the response
        await Account.create({
            username: req.body.username,
            password: req.body.password
        });

        return res.status(200).json({
            "success": true,
        });
    } catch(err) {
        return res.status(500).json({
            "success": false,
            "reason": "Duplicated username",
            "error_code": ERROR_TYPES.DB_ERROR
        });
    }
});

module.exports = router;
