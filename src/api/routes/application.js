import { Router } from "express";
import * as validators from "../middleware/validators/application.js";
import ApplicationService from "../../services/application.js";
import CompanyApplication from "../../models/CompanyApplication.js";


const router = Router();

export default (app) => {
    app.use("/apply/company", router);

    /**
     * Creates a new Company Application
     */
    router.post("/", validators.create, async (req, res, next) => {

        await CompanyApplication.deleteMany({ email: req.body.email, isVerified: false }).catch(function(error) {
            console.error(error);
            return next(error); // Failure
        });


        try {
            const applicationService = new ApplicationService();
            // This is safe since the service is destructuring the passed object and the fields have been validated
            const application = await applicationService.create(req.body);
            const link = applicationService.buildConfirmationLink(application._id); // ObjectId(application)
            applicationService.sendConfirmationNotification(application.email, link);
            return res.json(application);
        } catch (err) {
            console.error(err);
            return next(err);
        }
    });

};
