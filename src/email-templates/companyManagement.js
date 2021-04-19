module.exports = Object.freeze({
    COMPANY_BLOCKED_NOTIFICATION: (companyName) => ({
        subject: "Your company on NIJobs was blocked",
        template: "company_blocked_notification",
        context: { companyName },
    }),
    COMPANY_UNBLOCKED_NOTIFICATION: (companyName) => ({
        subject: "Your company on NIJobs was unblocked",
        template: "company_unblocked_notification",
        context: { companyName },
    }),
});
