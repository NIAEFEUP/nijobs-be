import CompanyApplication, { CompanyApplicationRules } from "../../models/CompanyApplication.js";

export const exceededCreationTimeLimit = async (email) => {
    const cursor = await CompanyApplication.findOne({ email, isVerified: false }).exec();
    if (cursor !== null && Date.now() - cursor.submittedAt < 5000 * 60) {
        throw new Error(CompanyApplicationRules.APPLICATION_RECENTLY_CREATED.msg);
    }
    return true;
};

export const deleteApplications = async (email) => {
    await CompanyApplication.deleteMany({ email: email, isVerified: false }).catch(function(error) {
        console.error(error);
        throw (error); // Failure
    });
};
