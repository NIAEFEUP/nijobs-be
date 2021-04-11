module.exports = Object.freeze({
    OFFER_DISABLED_NOTIFICATION: (companyName, offerTitle, description) => ({
        subject: "One of your NIJobs offers was disabled",
        template: "offer_disabled_notification",
        context: { companyName, offerTitle, description },
    })
});
