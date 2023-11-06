export default Object.freeze({
    title: {
        min_length: 1,
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
    vacancies: {
        min: 0,
    },
    HiddenOfferReasons: {
        ADMIN_BLOCK: "ADMIN_REQUEST",
        COMPANY_REQUEST: "COMPANY_REQUEST",
        COMPANY_BLOCKED: "COMPANY_BLOCKED",
        COMPANY_DISABLED: "COMPANY_DISABLED",
    },
    SortableFields: [
        "title",
        "publishDate",
        "publishEndDate",
        "jobMinDuration",
        "jobMaxDuration",
        "description",
        "vacancies",
        "jobType",
        "ownerName",
        "location",
    ],
    locations: {
        min_length: 1,
        max_length: 20,
    }
});
