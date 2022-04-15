import mongoose from "mongoose";
import config from "../config/env.js";
import Account from "../models/Account.js";
import hash from "../lib/passwordHashing.js";

export default async () => {
    if (!(config.db_uri || (config.db_host && config.db_port && config.db_name))) {
        console.error(`Either 'DB_URI' or 'DB_HOST', 'DB_PORT' and 'DB_NAME' must be specified in the env file! 
        See README.md for details.`);
        process.exit(125);
    }

    if (!(config.location_db_uri || (config.location_db_host && config.location_db_port && config.location_db_name))) {
        console.error(`Either 'LOCATION_DB_URI' or 
        'LOCATION_DB_HOST', 'LOCATION_DB_PORT' and 'LOCATION_DB_NAME' must be specified in the env file! 
        See README.md for details.`);
        process.exit(125);
    }

    const connectionOptions = {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
    };

    const appDbOptions = {
        user: config.db_user,
        pass: config.db_pass,
        dbName: config.db_name,
        ...connectionOptions,
    };

    const locationDbOptions = {
        user: config.location_db_user,
        pass: config.location_db_pass,
        dbName: config.location_db_name,
        ...connectionOptions,
    };

    try {
        await mongoose.connect(config.db_uri, appDbOptions);
        /* await */ mongoose.createConnection(config.location_db_uri, locationDbOptions);
        await createDefaultAdmin();
    } catch (err) {
        console.error("Mongoose: failure in initial connection to the DB (aborting, will not retry)", err);
        process.exit(44);
    }

    mongoose.connections.forEach((connection) => {
        connection.on("error", (err) => {
            console.error("Mongoose connection error:", err);
        });
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
