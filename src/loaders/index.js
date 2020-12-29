const mongooseLoader = require("./mongoose");
const expressLoader = require("./express");
const emailServiceLoader = require("./emailService");

const setupLoaders = async ({ expressApp }) => {
    await mongooseLoader();
    console.info("Mongoose DB connection initialized");
    await expressLoader(expressApp);
    console.info("Express initialized");
    await emailServiceLoader();
    console.info("Nodemailer initialized");
    require("../config/passport");
    console.info("Passport configurations loaded");
};

module.exports = setupLoaders;
