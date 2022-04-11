import { Router } from "express";

import * as validators from "../middleware/validators/location.js";

import LocationService from "../../services/location";

const router = Router();

export default (app) => {
    app.use("/location", router);

    router.get("/search",
        validators.search,
        (req, res, next) => {

            try {

                const locations = LocationService.search();

                return res.json(locations);
            } catch (err) {
                console.error(err);
                return next(err);
            }
        });
};
