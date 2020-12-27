module.exports = Object.freeze({
    NEW_COMPANY_APPLICATION_ADMINS: (email, companyName, motivation) => ({
        subject: `New company application pending review from ${companyName}`,
        template: "new_company_application_admins",
        context: { email, companyName, motivation },
    }),
    NEW_COMPANY_APPLICATION_COMPANY: (companyName, applicationId) => ({
        subject: "Your NIJobs Application",
        template: "new_company_application_company",
        context: { companyName, applicationId },
    }),
    APPROVAL_NOTIFICATION: (companyName) => ({
        subject: "Your NIJobs Application",
        template: "approval_notification",
        context: { companyName },
    })
});
