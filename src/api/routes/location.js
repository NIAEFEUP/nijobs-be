import { Router } from "express";
import * as HTTPStatus from "http-status-codes";

import * as validators from "../middleware/validators/location.js";

const router = Router();

export default (app) => {
    app.use("/location", router);

    router.get("/search",
        validators.search,
        (req, res, next) => {

            try {
                return res.status(HTTPStatus.OK);
            } catch (err) {
                console.error(err);
                return next(err);
            }
        });
};
