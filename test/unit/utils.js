const { APIError } = require("../../src/api/middleware/errorHandler");
const { or, DEFAULT_ERROR_CODE, DEFAULT_STATUS_CODE, DEFAULT_ERROR_MSG } = require("../../src/api/middleware/utils");

describe("Middleware utils", () => {
    test("Should pass with all functions not erroring", async () => {
        const m1 = (req, res, next) => next();
        const m2 = (req, res, next) => next();
        const m3 = (req, res, next) => next();

        const nextMock = jest.fn();
        await or([m1, m2, m3])({}, {}, nextMock);

        expect(nextMock).toHaveBeenCalledWith();
    });

    test("Should pass with only one function not erroring", async () => {
        const m1 = (req, res, next) => next();
        const m2 = (req, res, next) => next(new APIError(400, 1, "error_message", { test: 1 }));
        const m3 = () => {
            throw new APIError(400, 1, "error_message", { test: 1 });
        };

        const nextMock = jest.fn();
        await or([m1, m2, m3])({}, {}, nextMock);

        expect(nextMock).toHaveBeenCalledWith();
    });

    test("Should pass with only one function not erroring", async () => {
        const m1 = (req, res, next) => next(new APIError(400, 1, "error_message", { test: 1 }));
        const m2 = () => {
            throw new APIError(400, 1, "error_message", { test: 1 });
        };
        const m3 = (req, res, next) => next();

        const nextMock = jest.fn();
        await or([m1, m2, m3])({}, {}, nextMock);

        expect(nextMock).toHaveBeenCalledWith();
    });

    test("Should fail if every middleware erroring", async () => {
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
});
