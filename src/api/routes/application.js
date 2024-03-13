import { Router } from "express";
import * as validators from "../middleware/validators/application.js";
import ApplicationService, { CompanyApplicationAlreadyValidated } from "../../services/application.js";
import * as applicationMiddleware from "../middleware/application.js";
import { validToken } from "../middleware/auth.js";
import { StatusCodes as HTTPStatus } from "http-status-codes/build/cjs/status-codes.js";
import { buildErrorResponse, ErrorTypes } from "../middleware/errorHandler.js";

const router = Router();

export default (app) => {
    app.use("/apply/company", router);

    /**
     * Creates a new Company Application
     */
    router.post("/", validators.create, applicationMiddleware.exceededCreationTimeLimit, async (req, res, next) => {
        try {
            const applicationService = new ApplicationService();
            const application = await applicationService.updateOrCreate({ email: req.body.email }, req.body);
            return res.json(application);
        } catch (err) {
            console.error(err);
            return next(err);
        }
    });

    /**
     * Validates application
     */
    router.post("/:token/validate", validators.finishValidation, validToken, async (req, res, next) => {
        const { _id: id } = req.locals.token;
        try {
            await new ApplicationService().validateApplication(id);
            return res.status(HTTPStatus.OK).json({});
        } catch (err) {
            if (err instanceof CompanyApplicationAlreadyValidated) {
                return res
                    .status(HTTPStatus.CONFLICT)
                    .json(buildErrorResponse(ErrorTypes.FORBIDDEN, [{ msg: err.message }]));
            }
            console.error(err);
            return next(err);
        }
    });

};
