module.exports = {
    docs: {
        Introduction: [
            "intro",
            "intro/getting-started",
            "intro/how-to-docs",
        // For nested paths, simply wrap them in an object like so:
        // {
        //     "NestedPath": ["Nested1", "Nested2"]
        // }
        ],
        Offers: [
            "offers/search",
            "offers/create",
            "offers/edit",
            "offers/get",
            "offers/get-company",
            "offers/hide",
            "offers/disable",
            "offers/enable",
            "offers/archive"
        ],
        Companies: [
            "companies/list",
            "companies/finish-registration",
            "companies/block",
            "companies/unblock",
            "companies/disable",
            "companies/enable",
            "companies/delete",
            "companies/concurrent-offers"
        ],
        Applications: [
            "applications/create",
            "applications/search",
            "applications/approve",
            "applications/reject"
        ],
        Auth: [
            "auth/login",
            "auth/me",
            "auth/logout",
            "auth/register",
            "auth/recover",
            "auth/confirm",
            "auth/finish-recovery"
        ]
    },
};
