export default Object.freeze({
    projectName: {
        min_length: 2,
        max_length: 50,
    },
    description: {
        min_length: 2,
        max_length: 200,
    },
    language: {
        min_length: 2,
        max_length: 50,
    },
    skills: {
        min_length: 2,
        max_length: 50,
    },
    achievements: {
        min_length: 2,
        max_length: 200,
    },
    events: {
        min_length: 2,
        max_length: 200,
    },
    cvFileUrl: {
        min_length: 2,
        max_length: 200,
    },
    personalWebsite: {
        min_length: 2,
        max_length: 200,
    },
    personalizedFields: {
        fieldName: {
            type: String,
            required: true,
            maxlength: 100,
        },
        value: {
            type: String,
            maxlength: 300,
        },
    },
});
