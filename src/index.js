const config = require("./config/env");
const loaders = require("./loaders");
const express = require("express");
const https = require("https");

const app = express();

const startServer = async () => {
    await loaders({ expressApp: app });

    // Running the application in test mode does not start listening because parallel tests would result in EADDRINUSE
    if (process.env.NODE_ENV !== "test") {

        let server = app;
        if (process.env.NODE_ENV !== "production") {
            const fs = require("fs").promises;
            const path = require("path");
            const [key, cert] = await Promise.all([
                fs.readFile(path.join(__dirname, "../certs/key.pem")),
                fs.readFile(path.join(__dirname, "../certs/cert.pem"))
            ]);
            server = https.createServer({ key: key, cert: cert }, app);
        }

        server.listen(config.port, (err) => {
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
