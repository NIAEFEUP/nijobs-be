import { Router } from "express";

const router = Router();

export default (app) => {
    app.use("/location", router);

    router.get("/search", (req, res, next) => {


    });
};
