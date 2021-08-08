const { hasAdminPrivileges, setTargetOwner } = require("../api/middleware/auth");

module.exports = (app) => {

    // Populates req.hasAdminPrivileges accordingly
    app.use(hasAdminPrivileges);

    // Populates req.targetOwner accordingly
    app.use(setTargetOwner);

};
