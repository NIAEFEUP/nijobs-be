const mongoose = require("mongoose");
const { Schema, Types } = mongoose;
const JobTypes = require("./JobTypes");
const {FieldTypes, MIN_FIELDS, MAX_FIELDS} = require("./FieldTypes");
const {TechnologyTypes, MIN_TECHNOLOGIES, MAX_TECHNOLOGIES} = require("./TechnologyTypes");

const uniqueArrayPlugin = require("mongoose-unique-array");

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
            `End Date must not differ from the Publish Date by more than ${AD_MAX_LIFETIME_MONTHS} months`
        ]
    },

    jobMinDuration: {
        type: Number,
        required: function() {
            // jobMinDuration is required if jobMaxDuration was specified
            return !!this.jobMaxDuration;
        }
    },
    jobMaxDuration: {
        type: Number,
        validate: [
            validateJobMaxDuration,
            "jobMaxDuration must be larger than jobMinDuration"
        ]
    },

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
    jobType: {type: String, required: true, enum: JobTypes},
    fields: {
        // unique ensures that there are no repeated fields using mongoose-unique-array (see below)
        type:[{type: String, enum: FieldTypes, unique: true,}],
        required: true,
        validate: [
            (val) => val.length >= MIN_FIELDS && val.length <= MAX_FIELDS,
            `There must be between ${MIN_FIELDS} and ${MAX_FIELDS} fields`
        ]
    },
    technologies: {
        // unique ensures that there are no repeated technologies using mongoose-unique-array (see below)
        type:[{type: String, enum: TechnologyTypes, unique: true,}],
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
const AD_MAX_LIFETIME_MONTHS = 6;

function validateEndDate(value) {
    // Milisseconds from publish date to end date (Ad is no longer valid)
    const timeDiff = value.getTime() - this.publishDate.getTime();
    const diffInMonths = timeDiff / MONTH_IN_MS;

    return diffInMonths <= AD_MAX_LIFETIME_MONTHS;
}

// jobMaxDuration must be larger than jobMinDuration
function validateJobMaxDuration(value) {
    return value >= this.jobMinDuration;
}

// Adding unique array mongo plugin - to ensure that the elements inside the arrays are in fact unique
// See: https://thecodebarbarian.com/whats-new-in-mongoose-4.10-unique-in-arrays and https://www.npmjs.com/package/mongoose-unique-array
AdSchema.plugin(uniqueArrayPlugin);

const Ad = mongoose.model("Ad", AdSchema);

// Useful for testing correct field implementation
// console.log("DBG: ", AdSchema.path("technologies"));

module.exports = Ad;