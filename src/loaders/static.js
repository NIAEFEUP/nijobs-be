import express from "express";
import fs from "fs";
import config from "../config/env.js";

const setupStatic = (expressApp) => {
    if (!(config.webserver_host)) {
        console.error("'WEBSERVER_HOST' must be specified in the env file!");
        process.exit(125);
    }

    const file_dir = config.upload_folder;
    if (!fs.existsSync(file_dir)) fs.mkdirSync(file_dir);
    expressApp.use("/static", express.static(file_dir));
};

export default setupStatic;
