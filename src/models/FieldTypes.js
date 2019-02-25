const FieldTypes = Object.freeze({
    BACK_END : "Back-End",
    FRONT_END: "Front-End",
    DEV_OPS: "DevOps",
    BLOCKCHAIN: "Blockchain",
    MACHINE_LEARNING: "Machine Learning",
    OTHER: "Other",
});

const MIN_FIELDS = 2;
const MAX_FIELDS = 5;

module.exports = {
    FieldTypes,
    MIN_FIELDS,
    MAX_FIELDS,
};