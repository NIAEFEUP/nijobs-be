const config = require("./config/env");
const loaders = require("./loaders");
const express = require("express");

const app = express();

const startServer = async () => {
    await loaders({ expressApp: app });

    // Running the application in test mode does not start listening because parallel tests would result in EADDRINUSE
    if (process.env.NODE_ENV !== "test") {
        app.listen(config.port, (err) => {
            if (err) {
                console.error(err);
                return;
            }

            console.info(`Server listening on port ${config.port}`);
        });
    }
};

startServer();

if (process.env.NODE_ENV === "test") {
    // Necessary for test HTTP requests (End-to-End testing)
    module.exports = app;
}
