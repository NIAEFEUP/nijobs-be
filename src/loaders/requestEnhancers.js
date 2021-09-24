import { hasAdminPrivileges, setTargetOwner } from "../api/middleware/auth.js";

export default (app) => {

    // Populates req.hasAdminPrivileges accordingly
    app.use(hasAdminPrivileges);

    // Populates req.targetOwner accordingly
    app.use(setTargetOwner);

};
