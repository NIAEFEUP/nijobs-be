import CompanyApplication, { CompanyApplicationRules } from "../../models/CompanyApplication.js";
import { APIError, ErrorTypes } from "./errorHandler.js";
import { StatusCodes as HTTPStatus } from "http-status-codes/build/cjs/status-codes.js";
import { VALIDATION_LINK_EXPIRATION } from "../../models/constants/ApplicationStatus.js";
import { SECOND_IN_MS } from "../../models/constants/TimeConstants.js";

export const exceededCreationTimeLimit = async (req, res, next) => {
    const application = await CompanyApplication.findOne({ email: req.body.email, isVerified: false });
    if (application !== null && Date.now() < application.submittedAt.getTime() + (VALIDATION_LINK_EXPIRATION * SECOND_IN_MS)) {
        return next(new APIError(HTTPStatus.FORBIDDEN, ErrorTypes.FORBIDDEN, CompanyApplicationRules.APPLICATION_RECENTLY_CREATED.msg));
    }
    return next();
};
