//----------------------------------
// Base file for unit test utilities
//----------------------------------

// During the test the env variable must be set to test
if (process.env.NODE_ENV !== "test") {
    console.error("Entered test files without being in the test environment, aborting!");
    process.exit(55);
}

import mongoose from "mongoose";
// Occurs before all the tests, only once
beforeAll(async () => {
    await new Promise((resolve) => {
        mongoose.connection.once("open", () => {
            resolve();
        });
    });
});


// Mock the emailing service
jest.mock("./lib/emailService");

import { EmailService } from "./lib/emailService.js";
jest.spyOn(EmailService.prototype, "verifyConnection").mockImplementation(() => Promise.resolve());

// Setting up the end-to-end request testing helper methods
import supertest_request from "supertest";
import { default as app } from "./index.js";


// To handle the hanging test process problem
// (which weirdly enough was being caused by not disconnecting from the db - see https://github.com/visionmedia/supertest/issues/520)
afterAll(async () => {
    await (mongoose.connection && mongoose.connection.close());
    await mongoose.disconnect();
});

const request = () => supertest_request(app);
const agent = () => supertest_request.agent(app);

global.request = request;
global.agent = agent;
