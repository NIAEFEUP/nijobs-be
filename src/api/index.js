const { Router } = require("express");
const auth = require("./routes/auth");
const example = require("./routes/example");
const offer = require("./routes/offer");

module.exports = () => {
    const app = Router();
    auth(app);
    example(app);
    offer(app);

    return app;
};
