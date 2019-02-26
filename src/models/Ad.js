const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const JobTypes = require("./JobTypes");
const {FieldTypes, MIN_FIELDS, MAX_FIELDS} = require("./FieldTypes");
const {TechnologyTypes, MIN_TECHNOLOGIES, MAX_TECHNOLOGIES} = require("./TechnologyTypes");

const AdSchema = new Schema({
    // (DISCUSS) Max Length for title?
    title: {type: String, maxlength: 80, required: true},
    publishDate: {type: Date, required: true},
    // We also need to check the 6 month difference between both dates. (TODO)!
    endDate: {type: Date, required: true, validate: [dateValidator, "End Date must be bigger or equal than the Publication Date"]},
    // Shouldn't this just be a String? Simplifies companies wanting to insert ranges and whatnot (DISCUSS)
    jobDuration: {type: Number},
    jobStartDate: {type: Date},
    description: {type: String, maxlength: 1500, required: true},

    // There should be at least one contact (TODO)
    contacts: {type: String, required: true},

    isPaid: {type: Boolean},
    vacancies: {type: Number},
    jobType: {type: String, required: true, enum: Object.values(JobTypes)},
    fields: {
        type:[{type: String, enum: Object.values(FieldTypes)}],
        required: true,
        validate: [
            (val) => val.length >= MIN_FIELDS && val.length <= MAX_FIELDS,
            `There must be between ${MIN_FIELDS} and ${MAX_FIELDS} fields`
        ]
    },
    technologies: {
        type:[{type: String, enum: Object.values(TechnologyTypes)}],
        required: true,
        validate: [
            (val) => val.length >= MIN_TECHNOLOGIES && val.length <= MAX_TECHNOLOGIES,
            `There must be between ${MIN_TECHNOLOGIES} and ${MAX_TECHNOLOGIES} technologies`
        ]
    },

    isHidden: {type: Boolean},
    owner: {type: Types.ObjectId, ref: "Company", required: true},
});

// Check if the publication date is minor or equal than the end date.
function dateValidator(value) {
    return this.publishDate <= value;
}

const Ad = mongoose.model("Ad", AdSchema);

// Useful for testing correct field implementation
// console.log("DBG: ", AdSchema.path("jobType"));

module.exports = Ad;