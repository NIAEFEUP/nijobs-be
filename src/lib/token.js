import jwt from "jsonwebtoken";

export const generateToken = (data, secret, expiresInSeconds) => jwt.sign(
    { ...data },
    secret,
    { expiresIn: `${expiresInSeconds} seconds`, algorithm: "HS256" }
);

export const verifyAndDecodeToken = (token, secret) => jwt.verify(token, secret, { algorithm: "HS256" });
