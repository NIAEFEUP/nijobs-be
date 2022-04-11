import { Router } from "express";

import * as validators from "../middleware/validators/location.js";

import LocationService from "../../services/location.js";

const router = Router();

export default (app) => {
    app.use("/location", router);

    router.get("/search",
        validators.search,
        async (req, res, next) => {

            try {
                const locations = await new LocationService().search(req.query.searchTerm);

                return res.json(locations);
            } catch (err) {
                console.error(err);
                return next(err);
            }
        });
};
