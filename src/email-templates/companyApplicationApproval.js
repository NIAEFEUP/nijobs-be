export const NEW_COMPANY_APPLICATION_ADMINS = (email, companyName, motivation) => ({
    subject: `New company application pending review from ${companyName}`,
    template: "new_company_application_admins",
    context: { email, companyName, motivation },
});
export const NEW_COMPANY_APPLICATION_COMPANY = (companyName, applicationId) => ({
    subject: "Your NIJobs Application",
    template: "new_company_application_company",
    context: { companyName, applicationId },
});
export const APPLICATION_CONFIRMATION = (link) => ({
    subject: "Confirm your NIJobs application",
    template: "confirm-application",
    context: { link },
});
export const APPROVAL_NOTIFICATION = (companyName) => ({
    subject: "Welcome to NIJobs!",
    template: "approval_notification",
    context: { companyName },
});
export const REJECTION_NOTIFICATION = (companyName) => ({
    subject: "Your NIJobs Application",
    template: "rejection_notification",
    context: { companyName },
});

