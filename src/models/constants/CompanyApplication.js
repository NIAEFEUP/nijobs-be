const companyApplicationConstants = {
    companyName: {
        min_length: 2,
        max_length: 50,
    },
    motivation: {
        min_length: 10,
        max_length: 1500,
    },
    rejectReason: {
        min_length: 10,
        max_length: 1500,
    },
};

module.exports = companyApplicationConstants;
