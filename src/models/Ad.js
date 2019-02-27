const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const JobTypes = require("./JobTypes");
const {FieldTypes, MIN_FIELDS, MAX_FIELDS} = require("./FieldTypes");
const {TechnologyTypes, MIN_TECHNOLOGIES, MAX_TECHNOLOGIES} = require("./TechnologyTypes");

const AdSchema = new Schema({
    title: {type: String, maxlength: 90, required: true},
    publishDate: {
        type: Date,
        required: true,
        validate: [
            validatePublishDate,
            "Publish Date must be smaller than the End Date"
        ]
    },

    endDate: {
        type: Date,
        required: true,
        validate: [
            validateEndDate,
            "End Date must not differ from the Publish Date by more than 6 months"
        ]
    },

    // Shouldn't this just be a String? Simplifies companies wanting to insert ranges and whatnot (DISCUSS)
    jobDuration: {type: Number},
    jobStartDate: {type: Date},
    description: {type: String, maxlength: 1500, required: true},

    contacts: {
        type: Map,
        of: String,
        required: true,
        validate: [
            (val) => val.length >= 1,
            "There must be at least one contact"
        ]
    },

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

// Checking if the publication date is less than or equal than the end date.
function validatePublishDate(value) {
    return value <= this.endDate;
}

const MONTH_IN_MS = 1000 * 3600 * 24 * 30.42;

function validateEndDate(value) {
    // Milisseconds from publish date to end date (Ad is no longer valid)
    const timeDiff = value.getTime() - this.publishDate.getTime();
    const diffInMonths = timeDiff / MONTH_IN_MS;

    return diffInMonths <= 6;
}

const Ad = mongoose.model("Ad", AdSchema);

// Useful for testing correct field implementation
// console.log("DBG: ", AdSchema.path("publishDate"));

module.exports = Ad;