const mongoose = require("mongoose");

// Getting configs from env variables (.env files)
const {
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASS,
    DB_NAME,
} = process.env;

if (!DB_HOST || !DB_PORT) {
    console.error("'DB_HOST' and 'DB_PORT' must be specified in the env file! See README.md for details.");
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

const db_connection_promise = mongoose.connect(`mongodb://${DB_HOST}:${DB_PORT}`, options);

module.exports = db_connection_promise;
