import { Router } from "express";

import * as validators from "../middleware/validators/application.js";
import ApplicationService from "../../services/application.js";

const router = Router();

export default (app) => {
    app.use("/apply/company", router);

    /**
     * Creates a new Company Application
     */
    router.post("/", validators.create, async (req, res, next) => {

        try {
            // This is safe since the service is destructuring the passed object and the fields have been validated
            const application = await (new ApplicationService()).create(req.body);
            return res.json(application);
        } catch (err) {
            console.error(err);
            return next(err);
        }
    });
};
