import jwt from "jsonwebtoken";
import { APIError, ErrorTypes } from "../api/middleware/errorHandler.js";
import { StatusCodes as HTTPStatus } from "http-status-codes/build/cjs/status-codes.js";
import ValidationReasons from "../api/middleware/validators/validationReasons.js";

export const generateToken = (data, secret, expiresInSeconds) => jwt.sign(
    { ...data },
    secret,
    { expiresIn: `${expiresInSeconds} seconds`, algorithm: "HS256" }
);

export const verifyAndDecodeToken = (token, secret, next) => {
    try {
        return jwt.verify(token, secret, { algorithm: "HS256" });
    } catch (jwtErr) {
        if (jwtErr.name === "TokenExpiredError") {
            return next(new APIError(HTTPStatus.FORBIDDEN, ErrorTypes.FORBIDDEN, ValidationReasons.EXPIRED_TOKEN));
        } else {
            return next(new APIError(HTTPStatus.FORBIDDEN, ErrorTypes.FORBIDDEN, ValidationReasons.INVALID_TOKEN));
        }
    }
};
