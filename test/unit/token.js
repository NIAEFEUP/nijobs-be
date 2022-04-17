import { decodeToken, generateToken } from "../../src/lib/token";
import { SECOND_IN_MS } from "../../src/models/constants/TimeConstants";

describe("AWT Token tests", () => {
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
        expect(decodeToken(token, secret)).toHaveProperty("mock", data["mock"]);
    });

    test("should fail to decode token if invalid secret", () => {
        expect(decodeToken(token, `${secret}o`)).toBeNull();
    });

    test("should fail to decode token if expired", () => {
        const realTime = Date.now;
        const mockDate = Date.now() + (11 * SECOND_IN_MS);
        Date.now = () => mockDate;

        expect(decodeToken(token, `${secret}`)).toBeNull();

        Date.now = realTime;
    });
});
