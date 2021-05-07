const { hasAdminPrivileges } = require("../api/middleware/auth");

module.exports = (app) => {

    // Populates req.hasAdminPrivileges accordingly
    app.use(hasAdminPrivileges);

};
