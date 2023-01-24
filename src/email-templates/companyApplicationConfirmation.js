export const APPLICATION_CONFIRMATION = (link) => ({
    subject: "Confirm your NIJobs application",
    template: "request_password_recovery",
    context: { link },
});
