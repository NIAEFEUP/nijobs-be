
export const COMPANY_BLOCKED_NOTIFICATION = (companyName) => ({
    subject: "Your company account on NIJobs has been blocked",
    template: "company_blocked_notification",
    context: { companyName },
});
export const COMPANY_UNBLOCKED_NOTIFICATION = (companyName) => ({
    subject: "Your company account on NIJobs has been unblocked",
    template: "company_unblocked_notification",
    context: { companyName },
});
export const COMPANY_DISABLED_NOTIFICATION = (companyName) => ({
    subject: "Your company account on NIJobs has been disabled",
    template: "company_disabled_notification",
    context: { companyName },
});
export const COMPANY_ENABLED_NOTIFICATION = (companyName) => ({
    subject: "Your company account on NIJobs has been enabled",
    template: "company_enabled_notification",
    context: { companyName },
});
export const COMPANY_DELETED_NOTIFICATION = (companyName) => ({
    subject: "Your company account on NIJobs has been deleted",
    template: "company_deleted_notification",
    context: { companyName },
});
