const mongooseLoader = require("./mongoose");
const expressLoader = require("./express");

const setupLoaders = async ({ expressApp }) => {
    await mongooseLoader();
    console.info("Mongoose DB connection initialized");
    await expressLoader(expressApp);
    console.info("Express initialized");
    require("../config/passport");
    console.info("Passport configurations loaded");
};

module.exports = setupLoaders;
