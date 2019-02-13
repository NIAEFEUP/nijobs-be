const express = require("express");
const router = express.Router();
const ERROR_TYPES = require("./errors/errorHandler");

router.get("/:name", (req, res) => {
    res.status(200).json({
        "hi": req.params.name,
        "wow": true,
    });
});

router.get("/", (req, res) => {
    // Getting from db
    const users = [];

    res.status(200)
        .json({
            "success": true,
            users, // Equivalent to "users": users
        });
});

router.post("/", (req, res) => {
    if (!req.body.username) {
        res.status(400).json({
            "success": false,
            "reason": "No username specified",
            "error_code": ERROR_TYPES.MISSING_FIELD,
        });
        return;
    }

    // Inserting user into db and replying with success or not
    
});

module.exports = router;