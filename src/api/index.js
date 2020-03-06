const { Router } = require("express");
const auth = require("./routes/auth");
const example = require("./routes/example");
const offer = require("./routes/offer");
const application = require("./routes/application");
const application_admin = require("./routes/application_admin");

module.exports = () => {
    const app = Router();
    auth(app);
    example(app);
    offer(app);
    application(app);
    application_admin(app);

    return app;
};
