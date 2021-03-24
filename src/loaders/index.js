const mongooseLoader = require("./mongoose");
const expressLoader = require("./express");
const emailServiceLoader = require("./emailService");
const staticFilesLoader = require("./static");

const setupLoaders = async ({ expressApp }) => {
    await mongooseLoader();
    console.info("Mongoose DB connection initialized");
    await expressLoader(expressApp);
    console.info("Express initialized");
    await emailServiceLoader();
    console.info("Nodemailer initialized");
    require("../config/passport");
    console.info("Passport configurations loaded");
    staticFilesLoader(expressApp);
    console.info("Static files being served at /static");
};

module.exports = setupLoaders;
