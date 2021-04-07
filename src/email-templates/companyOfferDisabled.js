module.exports = Object.freeze({
    OFFER_DISABLED_NOTIFICATION: (companyName, offerTitle, description) => ({
        subject: "Your NIJobs Offer",
        template: "offer_disabled_notification",
        context: { companyName, offerTitle, description },
    })
});
