import { Router } from "express";
import * as validators from "../middleware/validators/application.js";
import ApplicationService from "../../services/application.js";
import * as applicationMiddleware from "../middleware/application.js";
import { validToken } from "../middleware/auth.js";
import { StatusCodes as HTTPStatus } from "http-status-codes/build/cjs/status-codes.js";
import * as validatorsd from "../middleware/validators/auth.js";


const router = Router();

export default (app) => {
    app.use("/apply/company", router);

    /**
     * Creates a new Company Application
     */
    router.post("/", validators.create, async (req, res, next) => {
        try {
            await applicationMiddleware.exceededCreationTimeLimit(req.body.email);
            await applicationMiddleware.deleteApplications(req.body.email);
            const applicationService = new ApplicationService();
            // This is safe since the service is destructuring the passed object and the fields have been validated
            const application = await applicationService.create(req.body);
            const link = applicationService.buildConfirmationLink(application._id); // ObjectId(application)
            await applicationService.sendConfirmationNotification(application.email, link);
            return res.json(application);
        } catch (err) {
            console.error(err);
            return next(err);
        }
    });
    router.get("/recover/:token/confirm", validatorsd.confirmRecover, validToken, (req, res) => res.status(HTTPStatus.OK).json({}));

    router.post("/recover/:token/confirm", validatorsd.finishRecover, validToken, async (req, res, next) => {
        const { id } = req.locals.token;
        try {
            await new ApplicationService().applicationValidation(id);
            return res.status(HTTPStatus.OK).json({});
        } catch (err) {
            console.error(err);
            return next(err);
        }
    });

};
