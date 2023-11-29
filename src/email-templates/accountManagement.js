export const REQUEST_ACCOUNT_RECOVERY = (link) => ({
    subject: "Recover your NIJobs account!",
    template: "request_password_recovery",
    context: { link },
});
