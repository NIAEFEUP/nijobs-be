import { verifyAndDecodeToken, generateToken } from "../../src/lib/token";
import { SECOND_IN_MS } from "../../src/models/constants/TimeConstants";

describe("JWT Token tests", () => {
    const data = {
        mock: "data"
    };

    const secret = "secret";
    const expiration = 10; // Seconds

    let token;

    beforeAll(() => {
        token = generateToken(data, secret, expiration);
    });

    test("should decoded token", () => {
        expect(verifyAndDecodeToken(token, secret)).toHaveProperty("mock", data["mock"]);
    });

    test("should fail to decode token if invalid secret", () => {
        expect(verifyAndDecodeToken(token, `${secret}o`)).toBeNull();
    });

    test("should fail to decode token if expired", () => {
        const realTime = Date.now;
        const mockDate = Date.now() + (11 * SECOND_IN_MS);
        Date.now = () => mockDate;

        expect(verifyAndDecodeToken(token, `${secret}`)).toBeNull();

        Date.now = realTime;
    });
});
