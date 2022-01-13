export default Object.freeze({
    title: {
        max_length: 90,
    },
    description: {
        max_length: 1500,
    },
    contacts: {
        min_length: 1,
    },
    requirements: {
        min_length: 1,
    },
    HiddenOfferReasons: {
        ADMIN_BLOCK: "ADMIN_REQUEST",
        COMPANY_REQUEST: "COMPANY_REQUEST",
        COMPANY_BLOCKED: "COMPANY_BLOCKED",
        COMPANY_DISABLED: "COMPANY_DISABLED",
    },
});
