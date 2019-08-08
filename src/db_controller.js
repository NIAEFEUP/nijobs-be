const mongoose = require("mongoose");

if (!process.env.MONGO_URI) {
    console.error("'MONGO_URI' must be specified in the env file");
    process.exit(125);
}

const MONGO_URI = process.env.MONGO_URI;

const DB_NAME = (process.env.NODE_ENV === "test" ? "test-db" : "nijobs-db");

const options = {
    useNewUrlParser: true,
    dbName: process.env.MONGO_URI ? undefined : DB_NAME,
    useCreateIndex: true,
};

const db_connection_promise = mongoose.connect(MONGO_URI, options);

module.exports = db_connection_promise;