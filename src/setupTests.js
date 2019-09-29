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
beforeAll(async () => {
    await new Promise((resolve) => {
        mongoose.connection.once("open", () => {
            resolve();
        });
    });
});

// To handle the hanging test process problem
// (which weirdly enough was being caused by not disconnecting from the db - see https://github.com/visionmedia/supertest/issues/520)
afterAll(async () => {
    await (mongoose.connection && mongoose.connection.close());
});

// Setting up the end-to-end request testing helper methods
const supertest_request = require("supertest");
const app = require("./index");

const request = () => supertest_request(app);
const agent = () => supertest_request.agent(app);

global.request = request;
global.agent = agent;
