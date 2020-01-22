const passport = require("passport");
const bodyParser = require("body-parser");
const session = require("express-session");
const morgan = require("morgan");
const HTTPStatus = require("http-status-codes");

const apiRoutes = require("../api");
const config = require("../config/env");
const { defaultErrorHandler } = require("../api/middleware/errorHandler");

const helmet = require("helmet");

const RateLimit = require("express-rate-limit");
const MongoStore = require("rate-limit-mongo");

const API_REQUEST_TIME_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const API_MAX_REQUESTS_PER_WINDOW = 100;

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

    const mongo_uri = config.db_uri;

    // Set the API call rate limit only on production
    if (process.env.NODE_ENV === "production") {
        const api_rate_limiter = new RateLimit({
            store: new MongoStore({
                uri: mongo_uri,
            }),
            windowMs: API_REQUEST_TIME_WINDOW_MS,
            max: API_MAX_REQUESTS_PER_WINDOW,
            message: {
                error: "Too many requests issued from this IP, please try again after a while",
            },
        });

        // Adds rate limit to all routes
        app.use(api_rate_limiter);
    }

    // Adds protection to common attacks
    app.use(helmet());

    // Adds route logging
    if (process.env.NODE_ENV !== "test" || config.test_log_requests) {
        app.use(morgan("common"));
    }

    // Adding headers (CORS)
    app.use((_, res, next) => {
        // Allow connections for all origins
        res.setHeader("Access-Control-Allow-Origin", config.access_control_allow_origin);
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
    app.get("/", (_, res) => res.status(HTTPStatus.OK).json({ "online": true }));

    // Registering the application's routes
    // Using no prefix as the app will be mapped to /api anyway in the production server
    app.use(apiRoutes());

    // - Error handling
    // Adds default error catcher as last resort
    app.use(defaultErrorHandler);
};
