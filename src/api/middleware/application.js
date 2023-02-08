import CompanyApplication, { CompanyApplicationRules } from "../../models/CompanyApplication.js";
import { APIError, ErrorTypes } from "./errorHandler.js";
import { StatusCodes as HTTPStatus } from "http-status-codes/build/cjs/status-codes.js";
export const exceededCreationTimeLimit = async (email) => {
    const cursor = await CompanyApplication.findOne({ email, isVerified: false }).exec();
    if (cursor !== null && Date.now() - cursor.submittedAt < 5000 * 60) {
        throw new APIError(HTTPStatus.FORBIDDEN, ErrorTypes.FORBIDDEN, CompanyApplicationRules.APPLICATION_RECENTLY_CREATED);
    }
    return true;
};

export const deleteApplications = async (email) => {
    await CompanyApplication.deleteMany({ email: email, isVerified: false }).catch(function(error) {
        console.error(error);
        throw (error); // Failure
    });
};
