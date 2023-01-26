export const APPLICATION_CONFIRMATION = (link) => ({
    subject: "Confirm your NIJobs application",
    template: "confirm-application",
    context: { link },
});
