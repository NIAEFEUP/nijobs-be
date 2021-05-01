const { APIError, UnknownAPIError } = require("../../src/api/middleware/errorHandler");
const { or, DEFAULT_ERROR_CODE, DEFAULT_STATUS_CODE, DEFAULT_ERROR_MSG, when, godMode } = require("../../src/api/middleware/utils");
const withGodToken = require("../utils/GodToken");

describe("Middleware utils", () => {
    describe("or util", () => {
        test("Should pass if none of the functions error", async () => {
            const m1 = (req, res, next) => next();
            const m2 = (req, res, next) => next();
            const m3 = (req, res, next) => next();

            const nextMock = jest.fn();
            await or([m1, m2, m3])({}, {}, nextMock);

            expect(nextMock).toHaveBeenCalledWith();
        });

        test("Should pass if at least one function does not error", async () => {
            const pass = (req, res, next) => next();
            const err1 = (req, res, next) => next(new APIError(400, 1, "error_message", { test: 1 }));
            const err2 = () => {
                throw new APIError(400, 1, "error_message", { test: 1 });
            };

            const nextMock = jest.fn();

            await or([pass, err1, err2])({}, {}, nextMock);
            expect(nextMock).toHaveBeenNthCalledWith(1);

            await or([err1, pass, err2])({}, {}, nextMock);
            expect(nextMock).toHaveBeenNthCalledWith(2);

            await or([err1, err2, pass])({}, {}, nextMock);
            expect(nextMock).toHaveBeenNthCalledWith(3);
        });


        test("Should fail if every middleware errors", async () => {
            const m1 = (req, res, next) => next(new APIError(400, 1, "error_message1", { test: 1 }));
            const m2 = (req, res, next) => next(new APIError(400, 2, "error_message2", { test: 2 }));
            const m3 = () => {
                throw new APIError(400, 3, "error_message3", { test: 3 });
            };

            const nextMock = jest.fn();
            await or(
                [m1, m2, m3],
                {
                    status_code: 401,
                    error_code: 10,
                    msg: "The OR Errored"
                }
            )({}, {}, nextMock);

            expect(nextMock.mock.calls[0][0]).toBeInstanceOf(APIError);
            expect(nextMock.mock.calls[0][0].status_code).toBe(401);
            expect(nextMock.mock.calls[0][0].error_code).toBe(10);
            expect(nextMock.mock.calls[0][0].message).toBe("The OR Errored");
            expect(nextMock.mock.calls[0][0].payload).toEqual({
                or: [
                    {
                        error_code: 1,
                        errors: ["error_message1"],
                        test: 1
                    },
                    {
                        error_code: 2,
                        errors: ["error_message2"],
                        test: 2
                    },
                    {
                        error_code: 3,
                        errors: ["error_message3"],
                        test: 3
                    },
                ]
            });
        });

        test("Should fail with default errors if not provided", async () => {
            const m1 = (req, res, next) => next(new APIError(400, 1, "error_message1", { test: 1 }));
            const m2 = (req, res, next) => next(new APIError(400, 2, "error_message2", { test: 2 }));
            const m3 = () => {
                throw new APIError(400, 3, "error_message3", { test: 3 });
            };

            const nextMock = jest.fn();
            await or(
                [m1, m2, m3]
            )({}, {}, nextMock);

            expect(nextMock.mock.calls[0][0]).toBeInstanceOf(APIError);
            expect(nextMock.mock.calls[0][0].status_code).toBe(DEFAULT_STATUS_CODE);
            expect(nextMock.mock.calls[0][0].error_code).toBe(DEFAULT_ERROR_CODE);
            expect(nextMock.mock.calls[0][0].message).toBe(DEFAULT_ERROR_MSG);
            expect(nextMock.mock.calls[0][0].payload).toEqual({
                or: [
                    {
                        error_code: 1,
                        errors: ["error_message1"],
                        test: 1
                    },
                    {
                        error_code: 2,
                        errors: ["error_message2"],
                        test: 2
                    },
                    {
                        error_code: 3,
                        errors: ["error_message3"],
                        test: 3
                    },
                ]
            });
        });

        test("Should fail with Unknown Error if non-APIError is thrown", async () => {
            const m1 = (req, res, next) => next(new Error("Something has failed"));
            const m2 = () => {
                throw new Error("Something has failed");
            };

            const nextMock = jest.fn();
            await or(
                [m1, m2]
            )({}, {}, nextMock);

            expect(nextMock.mock.calls[0][0]).toBeInstanceOf(APIError);
            expect(nextMock.mock.calls[0][0].status_code).toBe(DEFAULT_STATUS_CODE);
            expect(nextMock.mock.calls[0][0].error_code).toBe(DEFAULT_ERROR_CODE);
            expect(nextMock.mock.calls[0][0].message).toBe(DEFAULT_ERROR_MSG);
            expect(nextMock.mock.calls[0][0].payload).toEqual({
                or: [
                    (new UnknownAPIError()).toObject(),
                    (new UnknownAPIError()).toObject()
                ]
            });
        });
    });

    describe("when util", () => {
        test("Should not run middleware if shouldRun function returns false", async () => {
            const m = jest.fn((req, res, next) => next(new APIError(3, 3, "error")));

            const nextMock = jest.fn();
            await when(() => false, m)({}, {}, nextMock);

            expect(m.mock.calls.length).toBe(0);
            expect(nextMock).toHaveBeenCalledWith();
        });

        test("Should not run middleware if shouldRun is set to false", async () => {
            const m = jest.fn((req, res, next) => next(new APIError(3, 3, "error")));

            const nextMock = jest.fn();
            await when(false, m)({}, {}, nextMock);

            expect(m.mock.calls.length).toBe(0);
            expect(nextMock).toHaveBeenCalledWith();
        });

        test("Should fail if shouldRun set to true and Api error", async () => {
            const m = jest.fn((req, res, next) => next(new APIError(401, 3, "error")));

            const nextMock = jest.fn();
            await when(
                true,
                m
            )({}, {}, nextMock);

            expect(m.mock.calls.length).toBe(1);
            expect(nextMock.mock.calls[0][0]).toBeInstanceOf(APIError);
            expect(nextMock.mock.calls[0][0].status_code).toBe(401);
            expect(nextMock.mock.calls[0][0].error_code).toBe(3);
            expect(nextMock.mock.calls[0][0].message).toBe("error");
        });

        test("Should fail if shouldRun returns true and Api error", async () => {
            const m = jest.fn((req, res, next) => next(new APIError(401, 3, "error")));

            const nextMock = jest.fn();
            await when(
                () => true,
                m
            )({}, {}, nextMock);

            expect(m.mock.calls.length).toBe(1);
            expect(nextMock.mock.calls[0][0]).toBeInstanceOf(APIError);
            expect(nextMock.mock.calls[0][0].status_code).toBe(401);
            expect(nextMock.mock.calls[0][0].error_code).toBe(3);
            expect(nextMock.mock.calls[0][0].message).toBe("error");
        });
        test("Should fail with Unknown Error if non-APIError is thrown", async () => {
            const m = jest.fn(() => {
                throw new Error("Something has failed");
            });

            const nextMock = jest.fn();
            await when(
                true,
                m
            )({}, {}, nextMock);

            expect(m.mock.calls.length).toBe(1);
            expect(nextMock.mock.calls[0][0]).toBeInstanceOf(APIError);
            expect(nextMock.mock.calls[0][0].status_code).toBe(DEFAULT_STATUS_CODE);
            expect(nextMock.mock.calls[0][0].error_code).toBe(DEFAULT_ERROR_CODE);
            expect(nextMock.mock.calls[0][0].message).toBe(DEFAULT_ERROR_MSG);
        });
        test("Should fail with if APIError is thrown", async () => {
            const m = jest.fn(() => {
                throw new APIError(401, 3, "error");
            });

            const nextMock = jest.fn();
            await when(
                () => true,
                m
            )({}, {}, nextMock);

            expect(m.mock.calls.length).toBe(1);
            expect(nextMock.mock.calls[0][0]).toBeInstanceOf(APIError);
            expect(nextMock.mock.calls[0][0].status_code).toBe(401);
            expect(nextMock.mock.calls[0][0].error_code).toBe(3);
            expect(nextMock.mock.calls[0][0].message).toBe("error");
        });
    });

    describe("godMode util", () => {

        test("request should have property godMode if god_token is sent", async () => {

            const reqBody = withGodToken();

            const req = { body: reqBody };

            await godMode(req, {}, () => { });

            expect(req).toHaveProperty("godMode", true);

        });

        test("request should not have property godMode if god_token is not sent", async () => {

            const reqBody = {};

            const req = { body: reqBody };

            await godMode(req, {}, () => { });

            expect(req).not.toHaveProperty("godMode");

        });
    });
});
