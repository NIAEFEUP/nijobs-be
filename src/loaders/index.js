const mongooseLoader = require("./mongoose");
const elasticsearchLoader = require("./elasticsearch");
const expressLoader = require("./express");

const setupLoaders = async ({ expressApp }) => {
    await mongooseLoader();
    console.info("Mongoose DB connection initialized");
    await elasticsearchLoader();
    console.info("Elasticsearch connection initialized");
    await expressLoader(expressApp);
    console.info("Express initialized");
    require("../config/passport");
    console.info("Passport configurations loaded");
};

module.exports = setupLoaders;
