module.exports = Object.freeze({
    COMPANY_BLOCKED_NOTIFICATION: (companyName) => ({
        subject: "Your company account on NIJobs has been blocked",
        template: "company_blocked_notification",
        context: { companyName },
    }),
    COMPANY_UNBLOCKED_NOTIFICATION: (companyName) => ({
        subject: "Your company account on NIJobs has been unblocked",
        template: "company_unblocked_notification",
        context: { companyName },
    }),
});
