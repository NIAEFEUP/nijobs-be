import { Router } from "express";

import { StatusCodes as HTTPStatus } from "http-status-codes";
import * as validators from "../middleware/validators/application.js";
import ApplicationService from "../../services/application.js";
import CompanyApplication from "../../models/CompanyApplication.js";
import { ErrorTypes, APIError } from "../middleware/errorHandler.js";
import ValidationReasons from "../middleware/validators/validationReasons.js";

const router = Router();

export default (app) => {
    app.use("/apply/company", router);

    /**
     * Creates a new Company Application
     */
    router.post("/", validators.create, async (req, res, next) => {
        /*
          When creating a new Company Application verifies if there is already a application pending with the same email of the
          new apllication, if so verifies if the already existing application was created at at least 5 minutes if so then the old
          application is deleted, otherwise an error is return indication that there is already an application from that company
        */

        const cursor = await CompanyApplication.findOne({ email: req.body.email, isVerified: false }).exec();
        if (cursor !== null) {
            if (Date.now() - cursor.submittedAt < 5000 * 60) {
                return next(new APIError(
                    HTTPStatus.FORBIDDEN,
                    ErrorTypes.FORBIDDEN,
                    ValidationReasons.APPLICATION_RECENTLY_CREATED));
            } else {
                await CompanyApplication.deleteMany({ email: req.body.email, isVerified: false }).then(function() {
                    console.log("Data deleted"); // Success
                }).catch(function(error) {
                    console.error(error);
                    return next(error); // Failure
                });
            }
        }
        // Creates a new application
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
