const passport = require("passport");
const bodyParser = require("body-parser");
const session = require("express-session");
const morgan = require("morgan");

const apiRoutes = require("../api");
const config = require("../config/env");

module.exports = (app) => {
    // Checking for session secret
    if (!config.session_secret) {
        console.error("'SESSION_SECRET' must be defined in .env file! See README.md for details.");
    }

    // Setting session middleware
    app.use(session({
        path: "/",
        httpOnly: true,
        maxAge: null,
        secret: config.session_secret,
        resave: true,
        saveUninitialized: true,
        cookie: {
            secure: process.env.NODE_ENV === "production",
        },
    }));

    // JSON bodyparser (parses JSON request body into req.body)
    app.use(bodyParser.json());

    // Initializing passport authentication settings
    app.use(passport.initialize());
    app.use(passport.session());

    // Adds route logging
    app.use(morgan("common"));

    // Adding headers (CORS)
    app.use((_, res, next) => {
        // Allow connections for all origins
        res.setHeader("Access-Control-Allow-Origin", "*");
        // Allowed request methods
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
        // Allowed request headers
        res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, content-type, authorization");
        // Because we need the website to include cookies in the requests sent
        // to the API (we are using sessions)
        res.setHeader("Access-Control-Allow-Credentials", true);
        // Continue to next layer of middleware
        return next();
    });

    // Health check endpoint
    app.get("/", (_, res) => res.status(200).json({ "online": true }));

    // Registering the application's routes
    // Using no prefix as the app will be mapped to /api anyway in the production server
    app.use(apiRoutes());
};
