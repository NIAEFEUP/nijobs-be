export default Object.freeze({
    projectName: {
        min_length: 2,
        max_length: 50,
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
    cvFileUrl: {
        min_length: 2,
        max_length: 200,
    },
    personalWebsite: {
        min_length: 2,
        max_length: 200,
    },
    personalizedFields: [{
        fieldName: {
            type: String,
            required: true,
            maxlength: 100, // Adjust the max length as needed
        },
        value: {
            type: String,
            maxlength: 255, // Adjust the max length as needed
        },
    }],
});
