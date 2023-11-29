import { hasAdminPrivileges } from "../api/middleware/auth.js";

export default (app) => {

    // Populates req.hasAdminPrivileges accordingly
    app.use(hasAdminPrivileges);

};
