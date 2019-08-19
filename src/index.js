require("dotenv-flow").config();
const express = require("express");
const app = express();
const session = require("express-session");
const bodyParser = require("body-parser");

const PORT = process.env.PORT;

const db_connection = require("./db_controller");

db_connection
    .then(() => {
        console.info("Connected to DB successfully");
    })
    .catch((err) => {
        console.error("Error connecting to the DB (aborting): ", err);
        process.exit(44);
    });

// Setting session secret
if (!process.env.SESSION_SECRET) {
    console.error("'SESSION_SECRET' must be defined in .env file! See README.md for details.");
}
const SESSION_SECRET = process.env.SESSION_SECRET;

// Applying middleware
// JSON bodyparser (parses JSON request body into req.body)
app.use(bodyParser.json());

// Setting session middleware
app.use(session({
    path: "/",
    httpOnly: true,
    maxAge: null,
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === "production",
    },
}));

const passport = require("passport");
app.use(passport.initialize());
app.use(passport.session());

// Adding headers
app.use((req, res, next) => {
    // Website to allow to connect
    res.setHeader("Access-Control-Allow-Origin", "*");

    // Request methods to allow
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");

    // Request headers to allow
    res.setHeader("Access-Control-Allow-Headers", "X-Requested-With, content-type, authorization");

    // Because we need the website to include cookies in the requests sent
    // to the API (we want to use sessions)
    res.setHeader("Access-Control-Allow-Credentials", true);

    // Continue to next layer of middleware
    next();
});

// Route definitions (add more here!)
const example = require("./routes/example");
app.use("/api/example", example);
const account = require("./routes/auth");
app.use("/api/auth", account);


const server = app.listen(PORT);
if (process.env.NODE_ENV === "test") {
    console.info(`Server started in testing mode. Listening on port ${PORT}`);
    // Necessary for Chai HTTP requests (End-to-End testing)
    module.exports.server = server;
    module.exports.app = app;
} else {
    console.info(`Server listening on port ${PORT}`);
}
