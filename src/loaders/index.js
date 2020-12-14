const mongooseLoader = require("./mongoose");
const expressLoader = require("./express");
const nodemailerLoader = require("./nodemailer");

const setupLoaders = async ({ expressApp }) => {
    await mongooseLoader();
    console.info("Mongoose DB connection initialized");
    await expressLoader(expressApp);
    console.info("Express initialized");
    await nodemailerLoader();
    console.info("Nodemailer initialized");
    require("../config/passport");
    console.info("Passport configurations loaded");
};

module.exports = setupLoaders;
