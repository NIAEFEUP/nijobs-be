import { Router } from "express";
import auth from "./routes/auth.js";
import offer from "./routes/offer.js";
import application from "./routes/application.js";
import review from "./routes/review.js";
import company from "./routes/company.js";
import location from "./routes/location.js";

export default () => {
    const app = Router();
    auth(app);
    offer(app);
    application(app);
    review(app);
    company(app);
    location(app);

    return app;
};
