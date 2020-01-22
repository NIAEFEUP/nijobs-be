const mongoose = require("mongoose");
const config = require("../config/env");
const Account = require("../models/Account");
const hash  = require("../lib/passwordHashing");
const setupDbConnection = async () => {
    if (!(config.db_uri || (config.db_host && config.db_port))) {
        console.error("Either 'DB_URI' or 'DB_HOST' and 'DB_PORT' must be specified in the env file! See README.md for details.");
        process.exit(125);
    }

    if (!config.db_name) {
        console.error("'DB_NAME' must be specified in the env file! See README.md for details.");
        process.exit(126);
    }

    const options = {
        user: config.db_user,
        pass: config.db_pass,
        useNewUrlParser: true,
        useCreateIndex: true,
    };

    const connection_uri = config.db_uri;

    try {
        await mongoose.connect(connection_uri, options);
        await createDefaultAdmin();
    } catch (err) {
        console.error("Mongoose: failure in initial connection to the DB (aborting, will not retry)", err);
        process.exit(44);
    }

    mongoose.connection.on("error", (err) => {
        console.error("Mongoose connection error:", err);
    });
};

const createDefaultAdmin = async () => {
    if (process.env.NODE_ENV === "test") {
        return;
    }

    const acc = await Account.findOne({ email: config.admin_email });
    if (acc) {
        // User with admin email already exists
        return;
    }

    await Account.create({
        email: config.admin_email,
        password: await hash(config.admin_password),
        isAdmin: true,
    });

    console.info("Created default admin!");
};

module.exports = setupDbConnection;
