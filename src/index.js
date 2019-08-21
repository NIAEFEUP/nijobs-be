const config = require("./config/env");
const loaders = require("./loaders");
const express = require("express");

const app = express();
if (process.env.NODE_ENV === "test") {
    // Necessary for Chai HTTP requests (End-to-End testing)
    module.exports.app = app;
}

const startServer = async () => {
    await loaders({ expressApp: app });

    app.listen(config.port, (err) => {
        if (err) {
            console.error(err);
            return;
        }

        console.info(`Server listening on port ${config.port}`);
    });
};

startServer();
