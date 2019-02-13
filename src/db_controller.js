const mongoose = require("mongoose");

// Default mongo port
const DB_PORT = 27017;
const DB_HOST = process.env.DB_HOSTNAME || "localhost";

const MONGO_URI = process.env.MONGO_URI || `mongodb://${DB_HOST}:${DB_PORT}`;

const DB_NAME = (process.env.NODE_ENV === "test" ? "test-db" : "nijobs-db");

const options = {
    useNewUrlParser: true,
    dbName: process.env.MONGO_URI ? undefined : DB_NAME,
};

const db_connection_promise = mongoose.connect(MONGO_URI, options);

module.exports = db_connection_promise;