export default Object.freeze({
    companyName: {
        min_length: 2,
        max_length: 50,
    },
    bio: {
        max_length: 1500,
    },
    offers: {
        max_concurrent: 5,
    },
    contacts: {
        min_length: 1,
        max_length: 10
    }
});
