//----------------------------------
// Base file for unit test utilities
//----------------------------------

// During the test the env variable must be set to test
if (process.env.NODE_ENV !== "test") {
    console.error("Entered test files without being in the test environment, aborting!");
    process.exit(55);
}

const mongoose = require("mongoose");
// Ocurrs before all the tests, only once
before("Waiting for DB initialization", async () => {
    await new Promise((resolve) => {
        mongoose.connection.once("open", () => {
            resolve();
        });
    });
});

// Require the dev-dependencies
const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);
const should = chai.should();
const { app } = require("../src/index");

const request = () => chai.request(app);
const agent = () => chai.request.agent(app);

const sleep = (ms) => new Promise((resolve) => {
    setTimeout(resolve, ms);
});

module.exports = {
    should, request, agent, sleep,
};
