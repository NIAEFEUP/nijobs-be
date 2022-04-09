import config from "./config/env.js";

import loaders from "./loaders/index.js";
import express from "express";
import https from "https";

const app = express();

const startServer = async () => {
    await loaders({ expressApp: app });

    // Running the application in test mode does not start listening because parallel tests would result in EADDRINUSE
    if (process.env.NODE_ENV !== "test") {

        let server = app;
        if (process.env.NODE_ENV !== "production") {
            const { promises: fs } = await import("fs");

            const [key, cert] = await Promise.all([
                fs.readFile(new URL("../certs/key.pem", import.meta.url).pathname),
                fs.readFile(new URL("../certs/cert.pem", import.meta.url).pathname),
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
