const { hasAdminPrivileges } = require("../../src/api/middleware/auth");
const withGodToken = require("../utils/GodToken");

describe("Auth middleware tests", () => {

    const test_user_admin = {
        email: "admin@email.com",
        password: "password123",
        isAdmin: true,
    };

    const test_user = {
        email: "admin@email.com",
        password: "password123",
    };

    test("req body should have hasAdminPrivileges set to 'true' if god_token is sent", async () => {

        const reqBody = withGodToken();

        const req = { body: reqBody };

        await hasAdminPrivileges(req, {}, () => {});

        expect(req).toHaveProperty("hasAdminPrivileges", true);

    });

    test("req body should have hasAdminPrivileges set to 'true' if admin user is sent", async () => {

        const reqBody = {};

        const req = {
            body: reqBody,
            user: test_user_admin
        };

        await hasAdminPrivileges(req, {}, () => {});

        expect(req).toHaveProperty("hasAdminPrivileges", true);

    });

    test("req body should have hasAdminPrivileges set to 'false' if non-admin/god user is sent", async () => {

        const reqBody = {};

        const req = {
            body: reqBody,
            user: test_user
        };

        await hasAdminPrivileges(req, {}, () => {});

        expect(req).toHaveProperty("hasAdminPrivileges", false);

    });

    test("req body should have hasAdminPrivileges set to 'false' if no user is sent", async () => {

        const reqBody = {};

        const req = {
            body: reqBody
        };

        await hasAdminPrivileges(req, {}, () => {});

        expect(req).toHaveProperty("hasAdminPrivileges", false);

    });
});
