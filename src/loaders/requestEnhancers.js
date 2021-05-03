const { hasAdminPrivileges } = require("../api/middleware/auth");

module.exports = (app) => {

    // check if user is god or admin
    app.use(hasAdminPrivileges);

};
