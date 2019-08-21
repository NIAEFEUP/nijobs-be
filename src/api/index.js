const { Router } = require("express");
const auth = require("./routes/auth");
const example = require("./routes/example");

module.exports = () => {
    const app = Router();
    auth(app);
    example(app);

    return app;
};
