//// Base file for unit test utilities

require("dotenv-flow").config();

//During the test the env variable must be set to test
if (process.env.NODE_ENV !== "test") {
    console.error("Entered test files without being in the test environment, aborting!");
    process.exit(55);
}

// Ocurrs before all the tests, only once
before("Waiting for DB initialization", async () => {
    await require("../src/db_controller");
});

//Require the dev-dependencies
const chai = require("chai");
const chaiHttp = require("chai-http");
chai.use(chaiHttp);
const should = chai.should();
const {server, app} = require("../src/index");
// module.exports.server = server;
const request = () => chai.request(server);
const agent = () => chai.request.agent(app);

module.exports.should = should;
module.exports.request = request;
module.exports.agent = agent;

module.exports.sleep = ms => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
};