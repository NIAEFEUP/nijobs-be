import jwt from "jsonwebtoken";

export const generateToken = (data, secret, expiration) => jwt.sign(
    { ...data },
    secret,
    {   expiresIn: expiration }
);

export const decodeToken = (token, secret) => {
    try {
        return jwt.verify(token, secret);
    } catch (err) {
        return null;
    }
};
