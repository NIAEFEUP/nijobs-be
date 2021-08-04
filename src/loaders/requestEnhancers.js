const { hasAdminPrivileges, setOwnerCompany } = require("../api/middleware/auth");

module.exports = (app) => {

    // Populates req.hasAdminPrivileges accordingly
    app.use(hasAdminPrivileges);
    app.use(setOwnerCompany);

};
