const express = require("express");
const router = express.Router();
const ERROR_TYPES = require("./errors/errorHandler");

const ExampleUser = require("../models/ExampleUser");

/**
 * Hello Worlds the given user name
 */
router.get("/:name", (req, res) => {
    res.status(200).json({
        "hi": req.params.name,
        "wow": true,
    });
});

/**
 * Gets all the users from the db
 */
router.get("/", async (req, res) => {
    try {
        const users = await ExampleUser.find();

        return res.status(200).json({
            "success": true,
            users, // Equivalent to "users": users
        });

    } catch(err) {
        return res.status(500).json({
            "success": false,
            "reason": "dunno",
            "error_code": ERROR_TYPES.DB_ERROR,
        });
    }
});

/**
 * Creates a new user
 */
router.post("/", async (req, res) => {
    if (!req.body.username) {
        return res.status(400).json({
            "success": false,
            "reason": "No username specified",
            "error_code": ERROR_TYPES.MISSING_FIELD,
        });
    }

    // Inserting user into db and replying with success or not
    try {
        await ExampleUser.create({
            username: req.body.username,
            age: req.body.age
        });

        return res.status(200).json({
            "success": true,
        });
    } catch(err) {
        return res.status(500).json({
            "success": false,
            "reason": "dunno2",
            "error_code": ERROR_TYPES.DB_ERROR
        });
    }
});

module.exports = router;