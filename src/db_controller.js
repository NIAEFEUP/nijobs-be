const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

const DB_NAME = (process.env.NODE_ENV === "test" ? "test-db" : "nijobs-db");

const options = {
    useNewUrlParser: true,
    dbName: process.env.MONGO_URI ? undefined : DB_NAME,
};

const db_connection_promise = mongoose.connect(MONGO_URI, options);

module.exports = db_connection_promise;