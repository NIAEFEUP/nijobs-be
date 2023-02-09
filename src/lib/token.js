import jwt from "jsonwebtoken";
import base64url from "base64url";

export const generateToken = (data, secret, expiresInSeconds) => {
    const token = jwt.sign(
        { ...data },
        secret,
        { expiresIn: `${expiresInSeconds} seconds`, algorithm: "HS256" }
    );

    const encodedToken = base64url.encode(token);
    return encodedToken;
};

export const verifyAndDecodeToken = (encodedToken, secret) => {
    try {
        const token = base64url.decode(encodedToken);
        return jwt.verify(token, secret, { algorithm: "HS256" });
    } catch (err) {
        return null;
    }
};
