const mongoose = require("mongoose");

// Getting configs from env variables (.env files)
const {
    DB_URI,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASS,
    DB_NAME,
} = process.env;

if (!DB_URI && !(DB_HOST && DB_PORT)) {
    console.error("Either 'DB_URI' or 'DB_HOST' and 'DB_PORT' must be specified in the env file! See README.md for details.");
    process.exit(125);
}

if (!DB_NAME) {
    console.error("'DB_NAME' must be specified in the env file! See README.md for details.");
    process.exit(126);
}

const options = {
    useNewUrlParser: true,
    dbName: DB_NAME,
    user: DB_USER,
    pass: DB_PASS,
    useCreateIndex: true,
};

const connection_uri = DB_URI || `mongodb://${DB_HOST}:${DB_PORT}`;

// eslint-disable-next-line max-len
const db_connection_promise = mongoose.connect(connection_uri, options);

module.exports = db_connection_promise;
