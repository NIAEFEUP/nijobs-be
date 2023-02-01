import jwt from "jsonwebtoken";

export const generateToken = (data, secret, expiresInSeconds) => {
    const token = jwt.sign(
        { ...data },
        secret,
        { expiresIn: `${expiresInSeconds} seconds`, algorithm: "HS256" }
    );

    const encodedToken = Buffer.from(token).toString("base64");
    return encodedToken;
};

export const verifyAndDecodeToken = (encodedToken, secret) => {
    try {
        const token = Buffer.from(encodedToken, "base64").toString();
        return jwt.verify(token, secret, { algorithm: "HS256" });
    } catch (err) {
        return null;
    }
};
