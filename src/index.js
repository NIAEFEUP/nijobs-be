require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 4000;

if (process.env.NODE_ENV === "production") {
    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI was not defined in .env file and we are in production environment! Aborting!");
        process.exit(88);
    } else {
        console.warn("MONGO_URI was not defined in .enf file, falling back to localhost defaults.");
    }
}

const db_connection = require("./db_controller");

db_connection
    .then(() => {
        console.info("Connected to DB successfully");
    })
    .catch((err) => {
        console.error("Error connecting to the DB (aborting): ", err);
        process.exit(44);
    });

// Applying middleware
// JSON bodyparser (parses JSON request body into req.body)
app.use(bodyParser.json());

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



const server = app.listen(PORT);
if (process.env.NODE_ENV === "test") {
    console.info(`Server started in testing mode. Listening in internal port ${PORT}`);
    //Necessary for Chai HTTP requests (End-to-End testing)
    module.exports = server;
} else {
    console.info(`Server listening on internal port ${PORT}`);
}    