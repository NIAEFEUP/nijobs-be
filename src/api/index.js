const { Router } = require("express");
const auth = require("./routes/auth");
const example = require("./routes/example");
const offer = require("./routes/offer");
const application = require("./routes/application");
const review = require("./routes/review");

module.exports = () => {
    const app = Router();
    auth(app);
    example(app);
    offer(app);
    application(app);
    review(app);

    return app;
};
