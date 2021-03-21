module.exports = Object.freeze({
    OFFER_DISABLED_NOTIFICATION: (companyName, offerTitle) => ({
        subject: "Your NIJobs Offer",
        template: "offer_disabled_notification",
        context: { companyName, offerTitle },
    })
});
