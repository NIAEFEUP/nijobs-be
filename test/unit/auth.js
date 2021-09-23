import { hasAdminPrivileges } from "../../src/api/middleware/auth";
import withGodToken from "../utils/GodToken";

describe("Auth middleware tests", () => {

    describe("hasAdminPrivileges", () => {

        const test_user_admin = {
            email: "admin@email.com",
            password: "password123",
            isAdmin: true,
        };

        const test_user = {
            email: "user@email.com",
            password: "password123",
        };

        test("req body should have hasAdminPrivileges set to 'true' if god_token is sent", async () => {

            const req = { body: withGodToken() };

            await hasAdminPrivileges(req, {}, () => {});

            expect(req).toHaveProperty("hasAdminPrivileges", true);

        });

        test("req body should have hasAdminPrivileges set to 'true' if admin user is sent", async () => {

            const req = {
                body: {},
                user: test_user_admin
            };

            await hasAdminPrivileges(req, {}, () => {});

            expect(req).toHaveProperty("hasAdminPrivileges", true);

        });

        test("req body should have hasAdminPrivileges set to 'false' if non-admin/god user is sent", async () => {

            const req = {
                body: {},
                user: test_user
            };

            await hasAdminPrivileges(req, {}, () => {});

            expect(req).toHaveProperty("hasAdminPrivileges", false);

        });

        test("req body should have hasAdminPrivileges set to 'false' if no user is sent", async () => {

            const req = {
                body: {}
            };

            await hasAdminPrivileges(req, {}, () => {});

            expect(req).toHaveProperty("hasAdminPrivileges", false);

        });
    });
});
