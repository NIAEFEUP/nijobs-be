const HTTPStatus = require("http-status-codes");
const { Router } = require("express");

const { ErrorTypes, APIError } = require("../middleware/errorHandler");
const ExampleUser = require("../../models/ExampleUser");
const { or } = require("../middleware/utils");

const router = Router();

// IGNORE THIS FILE
// This was only boilerplate example and will be removed soon

module.exports = (app) => {
    app.use("/example", router);

    /**
     * Hello Worlds the given user name
     */
    router.get("/:name", (req, res) => {
        res.status(HTTPStatus.OK).json({
            "hi": req.params.name,
            "wow": true,
        });
    });

    const p1 = (req, res, next) => {
        console.log("RUNNING P1", req.query.p);
        if (req.query.p !== "1") return next(new APIError(HTTPStatus.BAD_GATEWAY, ErrorTypes.FORBIDDEN, "MUST BE 1"));
        console.log("IS 1");
        return next();
    };
    const p2 = (req, res, next) => {
        console.log("RUNNING P2");

        if (req.query.p !== "2") next(new APIError(HTTPStatus.BAD_GATEWAY, ErrorTypes.FORBIDDEN, "MUST BE 2"));
        return next();
    };

    /**
    * Gets all the users from the db
    */
    router.get("/", or([p1, p2], { msg: "ASD" }), async (req, res) => {
        try {
            const users = await ExampleUser.find();

            return res.status(HTTPStatus.OK).json({
                users, // Equivalent to "users": users
            });

        } catch (err) {
            return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).json({
                "reason": "dunno",
                "error_code": ErrorTypes.DB_ERROR,
            });
        }
    });

    /**
     * Creates a new user
     */
    router.post("/", async (req, res) => {
        if (!req.body.username) {
            return res.status(HTTPStatus.BAD_REQUEST).json({
                "reason": "No username specified",
                "error_code": ErrorTypes.MISSING_FIELD,
            });
        }

        // Inserting user into db and replying with success or not
        try {
        // Future note: the promise returns the inserted model, which can be useful for the response
            await ExampleUser.create({
                username: req.body.username,
                age: req.body.age,
            });

            return res.status(HTTPStatus.OK).json({});
        } catch (err) {
            return res.status(HTTPStatus.INTERNAL_SERVER_ERROR).json({
                "reason": "dunno2",
                "error_code": ErrorTypes.DB_ERROR,
            });
        }
    });
};
